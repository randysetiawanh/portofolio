-- Leftovers from moving these blocks into structured sections. They were
-- cluttering the Advanced tab and could never affect the page again.
UPDATE content SET value = json_remove(value, '$."cr.msib1"','$."cr.msib2"','$."f.cv"','$."f.cvv"','$."f.turnstile"','$."m.beng"','$."m.dt"','$."m.jwp"','$."s.gov"','$."s.gpa"','$."s.runtimes"','$."s.shipped"','$."t.drawn"','$."t.rev"','$."t.served"','$."t.sheet"','$."t.views"') WHERE key='i18n';
UPDATE meta SET value = CAST(CAST(value AS INTEGER)+1 AS TEXT) WHERE key='version';
