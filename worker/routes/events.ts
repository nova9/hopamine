import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";

import { countRowSchema, eventRowSchema, listEventsSchema } from "../schemas";
import type {
  AppEnvironment,
  CountRow,
  EventImageRow,
  EventPresentationRow,
  EventRow,
} from "../types";
import { createDownloadResponse } from "../utils";

const EVENT_COLUMNS = `
  id, slug, name, host, starts_at, location, description, category,
  presentation_key, presentation_name, presentation_type, presentation_size,
  image_key, image_name, image_type, image_size, created_at, updated_at
`;

function toEventResponse(event: EventRow, now = Date.now()) {
  const hasPresentation =
    event.presentation_key &&
    event.presentation_name &&
    event.presentation_type &&
    event.presentation_size !== null;

  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    host: event.host,
    startsAt: event.starts_at,
    location: event.location,
    description: event.description,
    category: event.category,
    status: Date.parse(event.starts_at) > now ? "upcoming" : "past",
    presentation: hasPresentation
      ? {
          name: event.presentation_name,
          type: event.presentation_type,
          size: event.presentation_size,
          downloadUrl: `/api/events/${event.slug}/presentation`,
        }
      : null,
    imageUrl: event.image_key ? `/api/events/${event.slug}/image` : null,
  };
}

export function registerEventRoutes(app: Hono<AppEnvironment>) {
  app.get(
    "/api/events",
    zValidator("query", listEventsSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          { error: "Invalid pagination parameters", issues: result.error.issues },
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
            `SELECT ${EVENT_COLUMNS} FROM events
             ORDER BY starts_at ASC, id ASC LIMIT ?1 OFFSET ?2`,
          )
          .bind(pageSize, offset),
      ]);
      const { total } = countRowSchema.parse(countResult.results[0]);
      const rows = eventRowSchema.array().parse(eventsResult.results);
      const now = Date.now();
      const events = rows.map((event) => ({
        ...toEventResponse(event, now),
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
      .prepare(`SELECT ${EVENT_COLUMNS} FROM events WHERE slug = ?1`)
      .bind(c.req.param("eventSlug"))
      .first();
    if (!row) return c.json({ error: "Event not found" }, 404);

    const event = eventRowSchema.parse(row);
    const submissionCount = Number(
      (
        await c.env.hopamine_db
          .prepare(
            "SELECT COUNT(*) AS total FROM submissions WHERE event_id=?1 AND deleted_at IS NULL",
          )
          .bind(event.id)
          .first<CountRow>()
      )?.total ?? 0,
    );
    return c.json({
      event: { ...toEventResponse(event), submissionCount },
    });
  });

  app.get("/api/events/:eventSlug/image", async (c) => {
    const event = await c.env.hopamine_db
      .prepare("SELECT image_key, image_type FROM events WHERE slug=?1")
      .bind(c.req.param("eventSlug"))
      .first<EventImageRow>();
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

  app.get("/api/events/:eventSlug/presentation", async (c) => {
    const event = await c.env.hopamine_db
      .prepare(
        "SELECT presentation_key, presentation_name, presentation_type FROM events WHERE slug = ?1",
      )
      .bind(c.req.param("eventSlug"))
      .first<EventPresentationRow>();
    if (!event?.presentation_key || !event.presentation_name) {
      return c.json({ error: "Presentation not found" }, 404);
    }
    const object = await c.env.hopamine_files.get(event.presentation_key);
    if (!object) return c.json({ error: "Presentation not found" }, 404);
    return createDownloadResponse(
      object,
      event.presentation_name,
      event.presentation_type || "application/octet-stream",
    );
  });
}
