-- One row per sync code. `data` holds the JSON snapshot of the user's
-- tasks and notes; `updated_at` is epoch milliseconds of the last write.
CREATE TABLE IF NOT EXISTS states (
  code       TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
