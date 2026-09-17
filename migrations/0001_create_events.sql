-- Migration number: 0001 	 2026-09-17T03:21:39.147Z
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('workshop', 'trade', 'collaboration')
  ),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_starts_at
  ON events (starts_at);

CREATE INDEX idx_events_category
  ON events (category);