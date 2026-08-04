-- Title, description and the link-preview card, moved out of the shell so they
-- can be edited in /admin without a deploy.
--
-- The search title leads with the job phrase people actually type; the link
-- preview keeps the register voice, since by then they have already clicked.

INSERT OR REPLACE INTO content (key, value, updated_at) VALUES (
  'seo',
  json_object(
    'title',         'Randy Setiawan Hoesin — Fullstack Developer, Jakarta',
    'description',   'Fullstack developer in Jakarta, freelancing since 2016. I build internal systems for government and enterprise — Laravel, PostgreSQL, Django, Swift.',
    'url',           'https://rancores.space/',
    'ogTitle',       'Randy Setiawan Hoesin — Systems Register',
    'ogDescription', 'Most of what I build has no public URL — internal systems that have to stay up. Fullstack developer in Jakarta, open to selected work.',
    'image',         '/m/img/og.png'
  ),
  unixepoch()
);

UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'version';
