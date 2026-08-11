-- The CV row loses `thumb`. Migration 0015 added it for a preview card on the
-- page itself; that card was never built, and the inline CV pane it would have
-- lived beside was removed on 2026-08-05. Nothing in the shell reads the key,
-- so it only misleads whoever opens the Advanced tab next.
--
-- The plate itself stays in R2 at img/cv-thumb.png — deleting a file is not
-- something a migration should do silently. Remove it from /admin > Media if
-- you want the bucket clean.
--
-- Written against the LIVE contact value (read 2026-08-06, version 339).
-- Apply with:
--   wrangler d1 execute portfolio-content --remote --file migrations/0016_drop_cv_thumb.sql
-- Never `d1 migrations apply --remote`: history is untracked remotely and it
-- would replay old seeds over content edited through /admin.
INSERT OR REPLACE INTO content (key, value, updated_at) VALUES ('contact', '[{"en":"Email","id":"Email","value":"randysetiawanh@gmail.com","href":"mailto:randysetiawanh@gmail.com"},{"en":"WhatsApp","id":"WhatsApp","value":"+62 821 2221 5391","num":true,"href":"https://wa.me/+6282122215391"},{"en":"LinkedIn","id":"LinkedIn","value":"Randy Setiawan Hoesin","href":"https://www.linkedin.com/in/randy-setiawan-hoesin/"},{"en":"Upwork","id":"Upwork","value":"Hire through Upwork","href":"https://www.upwork.com/freelancers/randysetiawanh","accent":true},{"en":"GitHub","id":"GitHub","value":"randysetiawanh","href":"https://github.com/randysetiawanh"},{"en":"Curriculum vitae","id":"Curriculum vitae","value":{"en":"See PDF","id":"Lihat PDF"},"href":"/m/cv/randy-setiawan-hoesin-cv.pdf","viewer":true,"accent":true}]', 1785976284);
UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'version';
