import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  countRowSchema,
  createEventSchema,
  eventRowSchema,
  listEventsSchema,
} from "./schemas";
import { slugify } from "./utils";

const app = new Hono<{ Bindings: Env }>();

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

app.post(
  "/api/events",
  zValidator("json", createEventSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Invalid event data",
          issues: result.error.issues,
        },
        400,
      );
    }
  }),
  async (c) => {
    const input = c.req.valid("json");
    const id = crypto.randomUUID();
    const slug = `${slugify(input.name)}-${id.slice(0, 8)}`;
    const startsAt = new Date(input.startsAt).toISOString();

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
          category
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
      )
      .run();

    return c.json(
      {
        event: {
          id,
          slug,
          ...input,
          startsAt,
          status: new Date(startsAt) > new Date() ? "upcoming" : "past",
        },
      },
      201,
    );
  },
);

export default app;
