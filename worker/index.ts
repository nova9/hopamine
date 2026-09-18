import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerAdminRoutes } from "./admin";
import { registerAuthRoutes, type AppEnvironment } from "./auth";
import { countRowSchema, eventRowSchema, listEventsSchema } from "./schemas";
import { createSubmissionSchema } from "./schemas";
import { sanitizeFilename } from "./utils";

const SUBMISSION_EXTENSIONS = [".doc", ".docx", ".pdf", ".avif"];
const SUBMISSION_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "image/avif",
]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 5;
const submissionAttempts = new Map<string, number[]>();

const app = new Hono<AppEnvironment>();

registerAuthRoutes(app);
registerAdminRoutes(app);

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    message: "Hopamine API is running",
  });
});

app.get(
  "/api/events",
  zValidator("query", listEventsSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Invalid pagination parameters",
          issues: result.error.issues,
        },
        400,
      );
    }
  }),
  async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const [countResult, eventsResult] = await c.env.hopamine_db.batch([
      c.env.hopamine_db.prepare("SELECT COUNT(*) AS total FROM events"),
      c.env.hopamine_db
        .prepare(
          `
            SELECT
              id,
              slug,
              name,
              host,
              starts_at,
              location,
              description,
              category,
              presentation_key,
              presentation_name,
              presentation_type,
              presentation_size,
              image_key, image_name, image_type, image_size,
              created_at,
              updated_at
            FROM events
            ORDER BY starts_at ASC, id ASC
            LIMIT ?1 OFFSET ?2
          `,
        )
        .bind(pageSize, offset),
    ]);

    const { total } = countRowSchema.parse(countResult.results[0]);
    const rows = eventRowSchema.array().parse(eventsResult.results);
    const now = Date.now();
    const events = rows.map((event) => ({
      id: event.id,
      slug: event.slug,
      name: event.name,
      host: event.host,
      startsAt: event.starts_at,
      location: event.location,
      description: event.description,
      category: event.category,
      status: Date.parse(event.starts_at) > now ? "upcoming" : "past",
      presentation:
        event.presentation_key &&
        event.presentation_name &&
        event.presentation_type &&
        event.presentation_size !== null
          ? {
              name: event.presentation_name,
              type: event.presentation_type,
              size: event.presentation_size,
              downloadUrl: `/api/events/${event.slug}/presentation`,
            }
          : null,
      imageUrl: event.image_key ? `/api/events/${event.slug}/image` : null,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    }));
    const totalPages = Math.ceil(total / pageSize);

    return c.json({
      events,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  },
);

app.get("/api/events/:eventSlug", async (c) => {
  const row = await c.env.hopamine_db
    .prepare(
      `
        SELECT
          id,
          slug,
          name,
          host,
          starts_at,
          location,
          description,
          category,
          presentation_key,
          presentation_name,
          presentation_type,
          presentation_size,
          image_key, image_name, image_type, image_size,
          created_at,
          updated_at
        FROM events
        WHERE slug = ?1
      `,
    )
    .bind(c.req.param("eventSlug"))
    .first();

  if (!row) {
    return c.json({ error: "Event not found" }, 404);
  }

  const event = eventRowSchema.parse(row);
  const hasPresentation =
    event.presentation_key &&
    event.presentation_name &&
    event.presentation_type &&
    event.presentation_size !== null;

  return c.json({
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      host: event.host,
      startsAt: event.starts_at,
      location: event.location,
      description: event.description,
      category: event.category,
      status: Date.parse(event.starts_at) > Date.now() ? "upcoming" : "past",
      presentation: hasPresentation
        ? {
            name: event.presentation_name,
            type: event.presentation_type,
            size: event.presentation_size,
            downloadUrl: `/api/events/${event.slug}/presentation`,
          }
        : null,
      imageUrl: event.image_key ? `/api/events/${event.slug}/image` : null,
      submissionCount: Number(
        (
          await c.env.hopamine_db
            .prepare(
              "SELECT COUNT(*) AS total FROM submissions WHERE event_id=?1 AND deleted_at IS NULL",
            )
            .bind(event.id)
            .first<{ total: number }>()
        )?.total ?? 0,
      ),
    },
  });
});

app.get("/api/events/:eventSlug/image", async (c) => {
  const event = await c.env.hopamine_db
    .prepare("SELECT image_key, image_type FROM events WHERE slug=?1")
    .bind(c.req.param("eventSlug"))
    .first<{ image_key: string | null; image_type: string | null }>();
  if (!event?.image_key) return c.json({ error: "Image not found" }, 404);
  const object = await c.env.hopamine_files.get(event.image_key);
  if (!object) return c.json({ error: "Image not found" }, 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": event.image_type || "image/png",
      "Content-Length": String(object.size),
      "Cache-Control": "public, max-age=3600",
    },
  });
});

async function findEvent(c: Context<AppEnvironment>, slug: string) {
  return c.env.hopamine_db
    .prepare(
      "SELECT id, slug, name, host, starts_at, location, description, category, image_key FROM events WHERE slug=?1",
    )
    .bind(slug)
    .first<Record<string, string | null>>();
}

app.get("/api/events/:eventSlug/submissions", async (c) => {
  const event = await findEvent(c, c.req.param("eventSlug"));
  if (!event) return c.json({ error: "Event not found" }, 404);
  const rows = await c.env.hopamine_db
    .prepare(
      "SELECT id, event_id, username, title, description, submitted_at, created_at FROM submissions WHERE event_id=?1 AND deleted_at IS NULL ORDER BY created_at DESC",
    )
    .bind(event.id)
    .all<Record<string, string>>();
  return c.json({
    submissions: rows.results.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      username: row.username,
      title: row.title,
      description: row.description,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      files: [],
    })),
  });
});

app.post("/api/events/:eventSlug/submissions", async (c) => {
  const clientKey = c.req.header("cf-connecting-ip") ?? "anonymous";
  const cutoff = Date.now() - 60 * 60 * 1000;
  const recent = (submissionAttempts.get(clientKey) ?? []).filter(
    (time) => time > cutoff,
  );
  if (recent.length >= 5)
    return c.json(
      { error: "Too many submissions. Please try again later." },
      429,
    );
  const event = await findEvent(c, c.req.param("eventSlug"));
  if (!event) return c.json({ error: "Event not found" }, 404);
  if (Date.parse(event.starts_at!) <= Date.now())
    return c.json({ error: "Past events no longer accept submissions" }, 409);
  const form = await c.req.formData();
  const result = createSubmissionSchema.safeParse({
    username: form.get("username"),
    title: form.get("title"),
    description: form.get("description"),
    submittedAt: form.get("submittedAt"),
  });
  if (!result.success)
    return c.json(
      { error: "Invalid submission data", issues: result.error.issues },
      400,
    );
  const files = form
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length || files.length > MAX_FILES)
    return c.json({ error: `Upload between 1 and ${MAX_FILES} files.` }, 400);
  for (const file of files) {
    if (
      !SUBMISSION_EXTENSIONS.some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      ) ||
      (file.type && !SUBMISSION_TYPES.has(file.type))
    )
      return c.json(
        { error: `${file.name} is not a DOC, DOCX, PDF, or AVIF file.` },
        400,
      );
    if (file.size > MAX_FILE_SIZE)
      return c.json({ error: `${file.name} exceeds the 25 MB limit.` }, 400);
  }
  const id = crypto.randomUUID();
  const uploaded: string[] = [];
  try {
    const fileRows = [];
    for (const file of files) {
      const fileId = crypto.randomUUID();
      const key = `submissions/${id}/${fileId}-${sanitizeFilename(file.name)}`;
      await c.env.hopamine_files.put(key, file, {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
      });
      uploaded.push(key);
      fileRows.push({ fileId, file, key });
    }
    await c.env.hopamine_db.batch([
      c.env.hopamine_db
        .prepare(
          "INSERT INTO submissions (id,event_id,username,title,description,submitted_at) VALUES (?,?,?,?,?,?)",
        )
        .bind(
          id,
          event.id,
          result.data.username,
          result.data.title,
          result.data.description,
          new Date(result.data.submittedAt).toISOString(),
        ),
      ...fileRows.map(({ fileId, file, key }) =>
        c.env.hopamine_db
          .prepare(
            "INSERT INTO submission_files (id,submission_id,filename,mime_type,size,storage_key) VALUES (?,?,?,?,?,?)",
          )
          .bind(
            fileId,
            id,
            file.name,
            file.type || "application/octet-stream",
            file.size,
            key,
          ),
      ),
    ]);
    submissionAttempts.set(clientKey, [...recent, Date.now()]);
    return c.json(
      {
        submission: {
          id,
          eventId: event.id,
          ...result.data,
          submittedAt: new Date(result.data.submittedAt).toISOString(),
          createdAt: new Date().toISOString(),
          files: fileRows.map(({ fileId, file }) => ({
            id: fileId,
            name: file.name,
            mimeType: file.type,
            size: file.size,
            downloadUrl: `/api/submission-files/${fileId}`,
          })),
        },
      },
      201,
    );
  } catch (error) {
    await Promise.all(uploaded.map((key) => c.env.hopamine_files.delete(key)));
    throw error;
  }
});

app.get("/api/events/:eventSlug/submissions/:submissionId", async (c) => {
  const event = await findEvent(c, c.req.param("eventSlug"));
  if (!event) return c.json({ error: "Event not found" }, 404);
  const row = await c.env.hopamine_db
    .prepare(
      "SELECT id,event_id,username,title,description,submitted_at,created_at FROM submissions WHERE id=?1 AND event_id=?2 AND deleted_at IS NULL",
    )
    .bind(c.req.param("submissionId"), event.id)
    .first<Record<string, string>>();
  if (!row) return c.json({ error: "Submission not found" }, 404);
  const files = await c.env.hopamine_db
    .prepare(
      "SELECT id,filename,mime_type,size FROM submission_files WHERE submission_id=?1",
    )
    .bind(row.id)
    .all<{ id: string; filename: string; mime_type: string; size: number }>();
  return c.json({
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      host: event.host,
      startsAt: event.starts_at,
      location: event.location,
      description: event.description,
      category: event.category,
      status: Date.parse(event.starts_at!) > Date.now() ? "upcoming" : "past",
      imageUrl: event.image_key ? `/api/events/${event.slug}/image` : null,
    },
    submission: {
      id: row.id,
      eventId: row.event_id,
      username: row.username,
      title: row.title,
      description: row.description,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      files: files.results.map((file) => ({
        id: file.id,
        name: file.filename,
        mimeType: file.mime_type,
        size: file.size,
        downloadUrl: `/api/submission-files/${file.id}`,
      })),
    },
  });
});

app.get("/api/submission-files/:fileId", async (c) => {
  const file = await c.env.hopamine_db
    .prepare(
      "SELECT filename,mime_type,storage_key FROM submission_files sf JOIN submissions s ON s.id=sf.submission_id WHERE sf.id=?1 AND s.deleted_at IS NULL",
    )
    .bind(c.req.param("fileId"))
    .first<{ filename: string; mime_type: string; storage_key: string }>();
  if (!file) return c.json({ error: "File not found" }, 404);
  const object = await c.env.hopamine_files.get(file.storage_key);
  if (!object) return c.json({ error: "File not found" }, 404);
  const filename = file.filename.replace(/["\\]/g, "-");
  return new Response(object.body, {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(object.size),
      "X-Content-Type-Options": "nosniff",
    },
  });
});

app.get("/api/events/:eventSlug/presentation", async (c) => {
  const event = await c.env.hopamine_db
    .prepare(
      `
        SELECT presentation_key, presentation_name, presentation_type
        FROM events
        WHERE slug = ?1
      `,
    )
    .bind(c.req.param("eventSlug"))
    .first<{
      presentation_key: string | null;
      presentation_name: string | null;
      presentation_type: string | null;
    }>();

  if (!event?.presentation_key || !event.presentation_name) {
    return c.json({ error: "Presentation not found" }, 404);
  }

  const object = await c.env.hopamine_files.get(event.presentation_key);
  if (!object) {
    return c.json({ error: "Presentation not found" }, 404);
  }

  const filename = event.presentation_name.replace(/["\\]/g, "-");
  const headers = new Headers();
  headers.set(
    "Content-Type",
    event.presentation_type || "application/octet-stream",
  );
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Content-Length", object.size.toString());

  return new Response(object.body, { headers });
});

export default app;
