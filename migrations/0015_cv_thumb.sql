-- The CV row gains a `thumb`: page one of the CV rendered once to a static
-- plate (R2, img/cv-thumb.png), which the shell shows as a preview card on
-- the page itself; clicking it opens the full sheet viewer. A shell without
-- the card ignores the key, so either deploy order is safe.
--
-- Written against the live contact value (read 2026-08-05, post-0014).
-- Apply with d1 execute, never `migrations apply --remote` (history is
-- untracked remotely; apply would replay old seeds over live content).
INSERT OR REPLACE INTO content (key, value, updated_at) VALUES ('contact', '[{"en":"Email","id":"Email","value":"randysetiawanh@gmail.com","href":"mailto:randysetiawanh@gmail.com"},{"en":"WhatsApp","id":"WhatsApp","value":"+62 821 2221 5391","num":true,"href":"https://wa.me/+6282122215391"},{"en":"LinkedIn","id":"LinkedIn","value":"Randy Setiawan Hoesin","href":"https://www.linkedin.com/in/randy-setiawan-hoesin/"},{"en":"Upwork","id":"Upwork","value":"Hire through Upwork","href":"https://www.upwork.com/freelancers/randysetiawanh","accent":true},{"en":"GitHub","id":"GitHub","value":"randysetiawanh","href":"https://github.com/randysetiawanh"},{"en":"Curriculum vitae","id":"Curriculum vitae","value":{"en":"See PDF","id":"Lihat PDF"},"href":"/m/cv/randy-setiawan-hoesin-cv.pdf","viewer":true,"accent":true,"thumb":"/m/img/cv-thumb.png"}]', 1785925000);
