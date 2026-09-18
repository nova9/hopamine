import type { createRemoteJWKSet } from "jose";

import type { eventRowSchema } from "./schemas";

export type AppEnvironment = {
  Bindings: Env & {
    ACCESS_TEAM_DOMAIN: string;
    ACCESS_AUD: string;
    SUBMISSION_RATE_LIMITER: RateLimit;
    GLOBAL_UPLOAD_RATE_LIMITER: RateLimit;
  };
  Variables: { moderatorEmail: string };
};

export type AccessJwks = ReturnType<typeof createRemoteJWKSet>;
export type EventRow = ReturnType<typeof eventRowSchema.parse>;

export type CountRow = { total: number };
export type EventImageRow = {
  image_key: string | null;
  image_type: string | null;
};
export type EventPresentationRow = {
  presentation_key: string | null;
  presentation_name: string | null;
  presentation_type: string | null;
};

export type SubmissionEventRow = {
  id: string;
  slug: string;
  name: string;
  host: string;
  starts_at: string;
  location: string;
  description: string;
  category: string;
  image_key: string | null;
};
export type SubmissionRow = {
  id: string;
  event_id: string;
  username: string;
  title: string;
  description: string;
  submitted_at: string;
  created_at: string;
};
export type SubmissionFileRow = {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
};
export type StoredSubmissionFileRow = {
  filename: string;
  mime_type: string;
  storage_key: string;
};
export type SubmissionStorageKeyRow = { storage_key: string };

export type AdminEventRow = Record<string, unknown>;
export type RawEventInput = Record<string, unknown>;
