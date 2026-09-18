ALTER TABLE events ADD COLUMN image_key TEXT;
ALTER TABLE events ADD COLUMN image_name TEXT;
ALTER TABLE events ADD COLUMN image_type TEXT;
ALTER TABLE events ADD COLUMN image_size INTEGER;

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  deleted_by TEXT
);

CREATE TABLE submission_files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_event ON submissions(event_id, created_at DESC);
CREATE INDEX idx_submission_files_submission ON submission_files(submission_id);
