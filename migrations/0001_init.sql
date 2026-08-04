-- Content is stored as JSON documents rather than a relational schema.
-- The shapes are deeply nested and bilingual (projects carry arrays of
-- highlights and screens in two languages); normalising that would create a
-- dozen join tables for data that is always read and written whole.
CREATE TABLE IF NOT EXISTS content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Mirrors what is in R2 so the admin can list uploads without paging the bucket.
CREATE TABLE IF NOT EXISTS media (
  key         TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  uploaded_at INTEGER NOT NULL
);

-- Bumped on every save; the public page cache is keyed on it.
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO meta (key, value) VALUES ('version', '1');
