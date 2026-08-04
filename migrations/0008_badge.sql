-- Availability reads as a badge; the orphaned i18n key goes, since nothing
-- rendered it and the admin was offering a field that edited nothing.
INSERT OR REPLACE INTO content (key, value, updated_at) VALUES ('identity', '{"lines":["Randy","Setiawan","Hoesin"],"coords":[{"en":"Jakarta, ID","id":"Jakarta, ID"},{"en":"6°10′S 106°49′E","id":"6°10′S 106°49′E","num":true},{"en":"GMT+7","id":"GMT+7"},{"en":"Open to selected work","id":"Terbuka untuk pekerjaan terpilih","badge":true}]}', 1785513590);
UPDATE content SET value = json_remove(value, '$."hero.avail"') WHERE key='i18n';
UPDATE meta SET value = CAST(CAST(value AS INTEGER)+1 AS TEXT) WHERE key='version';
