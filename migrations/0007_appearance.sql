-- Background pattern is now a content setting, editable in /admin.
INSERT OR REPLACE INTO content (key, value, updated_at) VALUES ('appearance', '{"background":"circuit"}', 1785506981);
UPDATE meta SET value = CAST(CAST(value AS INTEGER)+1 AS TEXT) WHERE key='version';
