-- Restores the Curriculum vitae contact row, deleted by accident in /admin
-- (both CV rows went at once when only the duplicate was meant to go).
-- Rebuilt from the live value, so the five surviving rows are untouched.
-- `thumb` is deliberately not restored: the shell dropped the thumbnail card
-- in favour of the inline PDF pane, which keys off `viewer` alone.
INSERT OR REPLACE INTO content (key, value, updated_at) VALUES ('contact', '[{"en":"Email","id":"Email","value":"randysetiawanh@gmail.com","href":"mailto:randysetiawanh@gmail.com"},{"en":"WhatsApp","id":"WhatsApp","value":"+62 821 2221 5391","num":true,"href":"https://wa.me/+6282122215391"},{"en":"LinkedIn","id":"LinkedIn","value":"Randy Setiawan Hoesin","href":"https://www.linkedin.com/in/randy-setiawan-hoesin/"},{"en":"Upwork","id":"Upwork","value":"Hire through Upwork","href":"https://www.upwork.com/freelancers/randysetiawanh","accent":true},{"en":"GitHub","id":"GitHub","value":"randysetiawanh","href":"https://github.com/randysetiawanh"},{"en":"Curriculum vitae","id":"Curriculum vitae","value":{"en":"See PDF","id":"Lihat PDF"},"href":"/m/cv/randy-setiawan-hoesin-cv.pdf","viewer":true,"accent":true}]', 1786100000);
