import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  countRowSchema,
  createEventSchema,
  eventRowSchema,
  listEventsSchema,
} from "./schemas";
import { sanitizeFilename, slugify } from "./utils";

const app = new Hono<{ Bindings: Env }>();

const MAX_PRESENTATION_SIZE = 25 * 1024 * 1024;
const PRESENTATION_EXTENSIONS = [".ppt", ".pptx", ".pdf"];
const PRESENTATION_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
]);

function getPresentationError(file: File) {
  const lowercaseName = file.name.toLowerCase();
  const hasAllowedExtension = PRESENTATION_EXTENSIONS.some((extension) =>
    lowercaseName.endsWith(extension),
  );

  if (!hasAllowedExtension || (file.type && !PRESENTATION_TYPES.has(file.type))) {
    return "The presentation must be a PPT, PPTX, or PDF file.";
  }

  if (file.size > MAX_PRESENTATION_SIZE) {
    return "The presentation must be 25 MB or smaller.";
  }

  return null;
}


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

app.post("/api/events", async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    let rawInput: Record<string, unknown>;
    let presentation: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      rawInput = {
        name: formData.get("name"),
        host: formData.get("host"),
        startsAt: formData.get("startsAt"),
        location: formData.get("location"),
        description: formData.get("description"),
        category: formData.get("category"),
      };

      const presentationValue = formData.get("presentation");
      if (presentationValue instanceof File && presentationValue.size > 0) {
        presentation = presentationValue;
      }
    } else {
      rawInput = await c.req.json<Record<string, unknown>>();
    }

    const result = createEventSchema.safeParse(rawInput);
    if (!result.success) {
      return c.json(
        {
          error: "Invalid event data",
          issues: result.error.issues,
        },
        400,
      );
    }

    if (presentation) {
      const presentationError = getPresentationError(presentation);
      if (presentationError) {
        return c.json({ error: presentationError }, 400);
      }
    }

    const input = result.data;
    const id = crypto.randomUUID();
    const slug = `${slugify(input.name)}-${id.slice(0, 8)}`;
    const startsAt = new Date(input.startsAt).toISOString();
    const presentationKey = presentation
      ? `events/${id}/${crypto.randomUUID()}-${sanitizeFilename(presentation.name)}`
      : null;

    if (presentation && presentationKey) {
      await c.env.hopamine_files.put(presentationKey, presentation, {
        httpMetadata: {
          contentType: presentation.type || "application/octet-stream",
        },
      });
    }

    try {
      await c.env.hopamine_db
        .prepare(
          `
          INSERT INTO events (
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
            presentation_size
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        )
        .bind(
          id,
          slug,
          input.name,
          input.host,
          startsAt,
          input.location,
          input.description,
          input.category,
          presentationKey,
          presentation?.name ?? null,
          presentation?.type ?? null,
          presentation?.size ?? null,
        )
        .run();
    } catch (error) {
      if (presentationKey) {
        await c.env.hopamine_files.delete(presentationKey);
      }
      throw error;
    }

    return c.json(
      {
        event: {
          id,
          slug,
          ...input,
          startsAt,
          status: new Date(startsAt) > new Date() ? "upcoming" : "past",
          presentation: presentation
            ? {
                name: presentation.name,
                type: presentation.type,
                size: presentation.size,
                downloadUrl: `/api/events/${slug}/presentation`,
              }
            : null,
        },
      },
      201,
    );
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
  headers.set("Content-Type", event.presentation_type || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Content-Length", object.size.toString());

  return new Response(object.body, { headers });
});

export default app;
