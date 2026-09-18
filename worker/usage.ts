import type { Context } from "hono";

import type { AppEnvironment } from "./types";

// Keep enough headroom for concurrent uploads and R2's GB-month accounting.
const MAX_STORED_BYTES = 7 * 1024 * 1024 * 1024;
const MAX_MONTHLY_R2_WRITES = 100_000;

function monthlyCounterKey(now = new Date()) {
  return `r2-writes:${now.toISOString().slice(0, 7)}`;
}

export async function getStoredBytes(c: Context<AppEnvironment>) {
  const [events, submissions] = await c.env.hopamine_db.batch([
    c.env.hopamine_db.prepare(
      "SELECT COALESCE(SUM(COALESCE(image_size, 0) + COALESCE(presentation_size, 0)), 0) AS total FROM events",
    ),
    c.env.hopamine_db.prepare(
      "SELECT COALESCE(SUM(sf.size), 0) AS total FROM submission_files sf JOIN submissions s ON s.id=sf.submission_id WHERE s.deleted_at IS NULL",
    ),
  ]);

  const eventTotal = (events.results[0] as { total: number }).total;
  const submissionTotal = (submissions.results[0] as { total: number }).total;
  return eventTotal + submissionTotal;
}

export async function hasStorageCapacity(
  c: Context<AppEnvironment>,
  additionalBytes: number,
) {
  return (await getStoredBytes(c)) + additionalBytes <= MAX_STORED_BYTES;
}

export async function reserveR2Writes(
  c: Context<AppEnvironment>,
  writeCount: number,
) {
  const key = monthlyCounterKey();
  const result = await c.env.hopamine_db
    .prepare(
      `
        INSERT INTO usage_counters (key, value)
        VALUES (?1, ?2)
        ON CONFLICT(key) DO UPDATE SET
          value = value + excluded.value,
          updated_at = CURRENT_TIMESTAMP
        WHERE value + excluded.value <= ?3
      `,
    )
    .bind(key, writeCount, MAX_MONTHLY_R2_WRITES)
    .run();

  return result.meta.changes > 0;
}

export const storageLimitBytes = MAX_STORED_BYTES;
