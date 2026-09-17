import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().trim().min(1).max(200),
  host: z.string().trim().min(1).max(100),
  startsAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid start date"),
  location: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5_000),
  category: z.enum(["workshop", "trade", "collaboration"]),
});

export const listEventsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const eventRowSchema = createEventSchema.omit({ startsAt: true }).extend({
  id: z.string(),
  slug: z.string(),
  starts_at: z.string(),
  presentation_key: z.string().nullable(),
  presentation_name: z.string().nullable(),
  presentation_type: z.string().nullable(),
  presentation_size: z.number().int().nonnegative().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const countRowSchema = z.object({
  total: z.number().int().nonnegative(),
});
