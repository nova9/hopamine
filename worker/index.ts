import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerAdminRoutes } from "./admin";
import { registerAuthRoutes, type AppEnvironment } from "./auth";
import { countRowSchema, eventRowSchema, listEventsSchema } from "./schemas";

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
      submissionCount: 0,
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
  headers.set("Content-Type", event.presentation_type || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Content-Length", object.size.toString());

  return new Response(object.body, { headers });
});

export default app;
