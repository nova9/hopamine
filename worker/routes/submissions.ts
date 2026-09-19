import type { Context, Hono } from "hono";

import { createSubmissionSchema } from "../schemas";
import type {
  AppEnvironment,
  StoredSubmissionFileRow,
  SubmissionEventRow,
  SubmissionFileRow,
  SubmissionRow,
} from "../types";
import { hasStorageCapacity, reserveR2Writes } from "../usage";
import {
  createDownloadResponse,
  createPreviewResponse,
  sanitizeFilename,
} from "../utils";
import {
  DOCUMENT_TYPE_LABEL,
  hasAllowedDocumentExtension,
  hasAllowedDocumentMimeType,
} from "../../src/lib/upload-policy";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 5;

function findEvent(c: Context<AppEnvironment>, slug: string) {
  return c.env.hopamine_db
    .prepare(
      "SELECT id, slug, name, host, starts_at, location, description, category, image_key FROM events WHERE slug=?1",
    )
    .bind(slug)
    .first<SubmissionEventRow>();
}

function toSubmissionResponse(row: SubmissionRow, files: SubmissionFileRow[]) {
  return {
    id: row.id,
    eventId: row.event_id,
    username: row.username,
    title: row.title,
    category: row.category,
    description: row.description,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    files: files.map((file) => ({
      id: file.id,
      name: file.filename,
      mimeType: file.mime_type,
      size: file.size,
      downloadUrl: `/api/submission-files/${file.id}`,
      previewUrl:
        file.mime_type === "application/pdf"
          ? `/api/submission-files/${file.id}/preview`
          : null,
    })),
  };
}

function getFileError(file: File) {
  if (
    !hasAllowedDocumentExtension(file.name) ||
    !hasAllowedDocumentMimeType(file.type)
  ) {
    return `${file.name} is not a ${DOCUMENT_TYPE_LABEL} file.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} exceeds the 10 MB limit.`;
  }
  return null;
}

export function registerSubmissionRoutes(app: Hono<AppEnvironment>) {
  app.get("/api/events/:eventSlug/submissions", async (c) => {
    const event = await findEvent(c, c.req.param("eventSlug"));
    if (!event) return c.json({ error: "Event not found" }, 404);
    const rows = await c.env.hopamine_db
      .prepare(
        "SELECT id, event_id, username, title, category, description, submitted_at, created_at FROM submissions WHERE event_id=?1 AND deleted_at IS NULL ORDER BY created_at DESC",
      )
      .bind(event.id)
      .all<SubmissionRow>();
    return c.json({
      submissions: rows.results.map((row) => toSubmissionResponse(row, [])),
    });
  });

  app.post("/api/events/:eventSlug/submissions", async (c) => {
    const clientKey = c.req.header("cf-connecting-ip") ?? "anonymous";
    const [clientLimit, globalLimit] = await Promise.all([
      c.env.SUBMISSION_RATE_LIMITER.limit({ key: clientKey }),
      c.env.GLOBAL_UPLOAD_RATE_LIMITER.limit({ key: "submissions" }),
    ]);
    if (!clientLimit.success || !globalLimit.success) {
      return c.json(
        { error: "Too many submission attempts. Please try again shortly." },
        429,
      );
    }

    const event = await findEvent(c, c.req.param("eventSlug"));
    if (!event) return c.json({ error: "Event not found" }, 404);
    if (Date.parse(event.starts_at) <= Date.now()) {
      return c.json({ error: "Past events no longer accept submissions" }, 409);
    }

    const form = await c.req.formData();
    const result = createSubmissionSchema.safeParse({
      username: form.get("username"),
      title: form.get("title"),
      category: form.get("category"),
      description: form.get("description"),
      submittedAt: form.get("submittedAt"),
    });
    if (!result.success) {
      return c.json(
        { error: "Invalid submission data", issues: result.error.issues },
        400,
      );
    }

    const files = form
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);
    if (!files.length || files.length > MAX_FILES) {
      return c.json({ error: `Upload between 1 and ${MAX_FILES} files.` }, 400);
    }
    for (const file of files) {
      const error = getFileError(file);
      if (error) return c.json({ error }, 400);
    }

    const uploadSize = files.reduce((total, file) => total + file.size, 0);
    if (uploadSize > MAX_UPLOAD_SIZE) {
      return c.json(
        { error: "The combined upload exceeds the 25 MB limit." },
        400,
      );
    }
    if (!(await hasStorageCapacity(c, uploadSize))) {
      return c.json(
        { error: "Uploads are temporarily unavailable because storage is full." },
        503,
      );
    }
    if (!(await reserveR2Writes(c, files.length))) {
      return c.json(
        { error: "Uploads are temporarily unavailable for this month." },
        503,
      );
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

      const submittedAt = new Date(result.data.submittedAt).toISOString();
      await c.env.hopamine_db.batch([
        c.env.hopamine_db
          .prepare(
            "INSERT INTO submissions (id,event_id,username,title,category,description,submitted_at) VALUES (?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            event.id,
            result.data.username,
            result.data.title,
            result.data.category,
            result.data.description,
            submittedAt,
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

      return c.json(
        {
          submission: toSubmissionResponse(
            {
              id,
              event_id: event.id,
              username: result.data.username,
              title: result.data.title,
              category: result.data.category,
              description: result.data.description,
              submitted_at: submittedAt,
              created_at: new Date().toISOString(),
            },
            fileRows.map(({ fileId, file }) => ({
              id: fileId,
              filename: file.name,
              mime_type: file.type,
              size: file.size,
            })),
          ),
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
        "SELECT id,event_id,username,title,category,description,submitted_at,created_at FROM submissions WHERE id=?1 AND event_id=?2 AND deleted_at IS NULL",
      )
      .bind(c.req.param("submissionId"), event.id)
      .first<SubmissionRow>();
    if (!row) return c.json({ error: "Submission not found" }, 404);
    const files = await c.env.hopamine_db
      .prepare(
        "SELECT id,filename,mime_type,size FROM submission_files WHERE submission_id=?1",
      )
      .bind(row.id)
      .all<SubmissionFileRow>();
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
        imageUrl: event.image_key ? `/api/events/${event.slug}/image` : null,
      },
      submission: toSubmissionResponse(row, files.results),
    });
  });

  app.get("/api/submission-files/:fileId", async (c) => {
    const cache = caches.default;
    const cached = await cache.match(c.req.raw);
    if (cached) return cached;
    const file = await c.env.hopamine_db
      .prepare(
        "SELECT filename,mime_type,storage_key FROM submission_files sf JOIN submissions s ON s.id=sf.submission_id WHERE sf.id=?1 AND s.deleted_at IS NULL",
      )
      .bind(c.req.param("fileId"))
      .first<StoredSubmissionFileRow>();
    if (!file) return c.json({ error: "File not found" }, 404);
    const object = await c.env.hopamine_files.get(file.storage_key);
    if (!object) return c.json({ error: "File not found" }, 404);
    const response = createDownloadResponse(
      object,
      file.filename,
      file.mime_type,
    );
    c.executionCtx.waitUntil(cache.put(c.req.raw, response.clone()));
    return response;
  });

  app.get("/api/submission-files/:fileId/preview", async (c) => {
    const cache = caches.default;
    const cached = await cache.match(c.req.raw);
    if (cached) return cached;
    const file = await c.env.hopamine_db
      .prepare(
        "SELECT filename,mime_type,storage_key FROM submission_files sf JOIN submissions s ON s.id=sf.submission_id WHERE sf.id=?1 AND s.deleted_at IS NULL",
      )
      .bind(c.req.param("fileId"))
      .first<StoredSubmissionFileRow>();
    if (!file) return c.json({ error: "File not found" }, 404);
    if (file.mime_type !== "application/pdf") {
      return c.json({ error: "A preview is not available for this file type" }, 415);
    }
    const object = await c.env.hopamine_files.get(file.storage_key);
    if (!object) return c.json({ error: "File not found" }, 404);
    const response = createPreviewResponse(
      object,
      file.filename,
      file.mime_type,
    );
    c.executionCtx.waitUntil(cache.put(c.req.raw, response.clone()));
    return response;
  });
}
