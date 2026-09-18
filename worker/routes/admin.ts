import type { Context, Hono } from "hono";

import { createEventSchema, updateEventSchema } from "../schemas";
import type {
  AdminEventRow,
  AppEnvironment,
  RawEventInput,
  SubmissionStorageKeyRow,
} from "../types";
import { hasStorageCapacity, reserveR2Writes } from "../usage";
import { sanitizeFilename, slugify } from "../utils";

const MAX_PRESENTATION_SIZE = 25 * 1024 * 1024;
const PRESENTATION_EXTENSIONS = [".ppt", ".pptx", ".pdf"];
const PRESENTATION_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS = [".avif"];
const IMAGE_TYPES = new Set(["image/avif"]);

function getImageError(file: File) {
  const lowercaseName = file.name.toLowerCase();
  const hasAllowedExtension = IMAGE_EXTENSIONS.some((extension) =>
    lowercaseName.endsWith(extension),
  );

  if (!hasAllowedExtension || (file.type && !IMAGE_TYPES.has(file.type))) {
    return "The event image must be converted to AVIF before upload.";
  }

  if (file.size > MAX_IMAGE_SIZE)
    return "The event image must be 10 MB or smaller.";
  return null;
}

async function parseEventForm(c: Context<AppEnvironment>) {
  const formData = await c.req.formData();
  const file = (name: string) => {
    const value = formData.get(name);
    return value instanceof File && value.size > 0 ? value : null;
  };
  return {
    rawInput: {
      name: formData.get("name"),
      host: formData.get("host"),
      startsAt: formData.get("startsAt"),
      location: formData.get("location"),
      description: formData.get("description"),
      category: formData.get("category"),
    },
    presentation: file("presentation"),
    image: file("image"),
  };
}

function getPresentationError(file: File) {
  const lowercaseName = file.name.toLowerCase();
  const hasAllowedExtension = PRESENTATION_EXTENSIONS.some((extension) =>
    lowercaseName.endsWith(extension),
  );

  if (
    !hasAllowedExtension ||
    (file.type && !PRESENTATION_TYPES.has(file.type))
  ) {
    return "The presentation must be a PPT, PPTX, or PDF file.";
  }

  if (file.size > MAX_PRESENTATION_SIZE) {
    return "The presentation must be 25 MB or smaller.";
  }

  return null;
}

export function registerAdminRoutes(app: Hono<AppEnvironment>) {
  app.post("/api/admin/events", async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    let rawInput: RawEventInput;
    let presentation: File | null = null;
    let image: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const parsed = await parseEventForm(c);
      rawInput = parsed.rawInput;
      presentation = parsed.presentation;
      image = parsed.image;
    } else {
      rawInput = await c.req.json<RawEventInput>();
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
    if (image) {
      const error = getImageError(image);
      if (error) return c.json({ error }, 400);
    }

    const uploadSize = (presentation?.size ?? 0) + (image?.size ?? 0);
    const uploadCount = Number(Boolean(presentation)) + Number(Boolean(image));
    if (uploadSize && !(await hasStorageCapacity(c, uploadSize)))
      return c.json(
        { error: "The storage safety limit has been reached." },
        503,
      );
    if (uploadCount && !(await reserveR2Writes(c, uploadCount)))
      return c.json(
        { error: "The monthly upload safety limit has been reached." },
        503,
      );

    const input = result.data;
    const id = crypto.randomUUID();
    const slug = `${slugify(input.name)}-${id.slice(0, 8)}`;
    const startsAt = new Date(input.startsAt).toISOString();
    const presentationKey = presentation
      ? `events/${id}/${crypto.randomUUID()}-${sanitizeFilename(presentation.name)}`
      : null;
    const imageKey = image
      ? `events/${id}/${crypto.randomUUID()}-${sanitizeFilename(image.name)}`
      : null;

    if (presentation && presentationKey) {
      await c.env.hopamine_files.put(presentationKey, presentation, {
        httpMetadata: {
          contentType: presentation.type || "application/octet-stream",
        },
      });
    }
    if (image && imageKey)
      await c.env.hopamine_files.put(imageKey, image, {
        httpMetadata: { contentType: image.type || "application/octet-stream" },
      });

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
              presentation_size, image_key, image_name, image_type, image_size
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          imageKey,
          image?.name ?? null,
          image?.type ?? null,
          image?.size ?? null,
        )
        .run();
    } catch (error) {
      if (presentationKey) {
        await c.env.hopamine_files.delete(presentationKey);
      }
      if (imageKey) await c.env.hopamine_files.delete(imageKey);
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
          submissionCount: 0,
          presentation: presentation
            ? {
                name: presentation.name,
                type: presentation.type,
                size: presentation.size,
                downloadUrl: `/api/events/${slug}/presentation`,
              }
            : null,
          imageUrl: image ? `/api/events/${slug}/image` : null,
        },
      },
      201,
    );
  });

  app.put("/api/admin/events/:eventSlug", async (c) => {
    const current = await c.env.hopamine_db
      .prepare("SELECT * FROM events WHERE slug = ?1")
      .bind(c.req.param("eventSlug"))
      .first<AdminEventRow>();
    if (!current) return c.json({ error: "Event not found" }, 404);
    if (Date.parse(String(current.starts_at)) <= Date.now())
      return c.json({ error: "Past events cannot be edited" }, 409);
    const { rawInput, presentation, image } = await parseEventForm(c);
    const result = updateEventSchema.safeParse(rawInput);
    if (!result.success)
      return c.json(
        { error: "Invalid event data", issues: result.error.issues },
        400,
      );
    if (presentation) {
      const error = getPresentationError(presentation);
      if (error) return c.json({ error }, 400);
    }
    if (image) {
      const error = getImageError(image);
      if (error) return c.json({ error }, 400);
    }
    const replacedSize =
      (presentation ? Number(current.presentation_size ?? 0) : 0) +
      (image ? Number(current.image_size ?? 0) : 0);
    const uploadSize = (presentation?.size ?? 0) + (image?.size ?? 0);
    const uploadCount = Number(Boolean(presentation)) + Number(Boolean(image));
    if (
      uploadSize &&
      !(await hasStorageCapacity(c, Math.max(0, uploadSize - replacedSize)))
    )
      return c.json(
        { error: "The storage safety limit has been reached." },
        503,
      );
    if (uploadCount && !(await reserveR2Writes(c, uploadCount)))
      return c.json(
        { error: "The monthly upload safety limit has been reached." },
        503,
      );
    const input = result.data;
    const id = String(current.id);
    const presentationKey = presentation
      ? `events/${id}/${crypto.randomUUID()}-${sanitizeFilename(presentation.name)}`
      : (current.presentation_key as string | null);
    const imageKey = image
      ? `events/${id}/${crypto.randomUUID()}-${sanitizeFilename(image.name)}`
      : (current.image_key as string | null);
    if (presentation)
      await c.env.hopamine_files.put(presentationKey!, presentation);
    if (image) await c.env.hopamine_files.put(imageKey!, image);
    try {
      await c.env.hopamine_db
        .prepare(
          `UPDATE events SET name=?, host=?, starts_at=?, location=?, description=?, category=?, presentation_key=?, presentation_name=?, presentation_type=?, presentation_size=?, image_key=?, image_name=?, image_type=?, image_size=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        )
        .bind(
          input.name,
          input.host,
          new Date(input.startsAt).toISOString(),
          input.location,
          input.description,
          input.category,
          presentationKey,
          presentation?.name ?? current.presentation_name,
          presentation?.type ?? current.presentation_type,
          presentation?.size ?? current.presentation_size,
          imageKey,
          image?.name ?? current.image_name,
          image?.type ?? current.image_type,
          image?.size ?? current.image_size,
          id,
        )
        .run();
    } catch (error) {
      if (presentation) await c.env.hopamine_files.delete(presentationKey!);
      if (image) await c.env.hopamine_files.delete(imageKey!);
      throw error;
    }
    if (presentation && current.presentation_key)
      await c.env.hopamine_files.delete(String(current.presentation_key));
    if (image && current.image_key)
      await c.env.hopamine_files.delete(String(current.image_key));
    return c.json({
      event: {
        id,
        slug: current.slug,
        ...input,
        startsAt: new Date(input.startsAt).toISOString(),
        status: "upcoming",
        imageUrl: imageKey ? `/api/events/${current.slug}/image` : null,
        submissionCount: 0,
      },
    });
  });

  app.delete("/api/admin/submissions/:submissionId", async (c) => {
    const id = c.req.param("submissionId");
    const files = await c.env.hopamine_db
      .prepare(
        "SELECT storage_key FROM submission_files WHERE submission_id=?1",
      )
      .bind(id)
      .all<SubmissionStorageKeyRow>();
    const result = await c.env.hopamine_db
      .prepare(
        "UPDATE submissions SET deleted_at=CURRENT_TIMESTAMP, deleted_by=?1 WHERE id=?2 AND deleted_at IS NULL",
      )
      .bind(c.get("moderatorEmail"), id)
      .run();
    if (!result.meta.changes)
      return c.json({ error: "Submission not found" }, 404);
    await Promise.all(
      files.results.map((file) =>
        c.env.hopamine_files.delete(file.storage_key),
      ),
    );
    return c.body(null, 204);
  });
}
