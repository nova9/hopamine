import type { Hono } from "hono";

import type { AppEnvironment } from "./auth";
import { createEventSchema } from "./schemas";
import { sanitizeFilename, slugify } from "./utils";

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

export function registerAdminRoutes(app: Hono<AppEnvironment>) {
  app.post("/api/admin/events", async (c) => {
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
          submissionCount: 0,
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
}
