import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { slugify } from "./utils";

const createEventSchema = z.object({
  name: z.string().trim().min(1).max(200),
  host: z.string().trim().min(1).max(100),
  startsAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid start date"),
  location: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5_000),
  category: z.enum(["workshop", "trade", "collaboration"]),
});

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    message: "Hopamine API is running",
  });
});

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
