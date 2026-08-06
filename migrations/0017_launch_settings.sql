-- Setelan animasi peluncuran masuk ke dokumen `appearance`, di sebelah pilihan
-- pattern latar. Nilainya persis yang disetujui lewat prototipe
-- design/flight-anim.html: 400 butir, sebar 140 px, terang 1.00, oranye 50%.
--
-- Shell memakai nilai bawaan yang sama kalau kunci ini belum ada, jadi urutan
-- deploy bebas. Shell juga meng-clamp setiap nilai, jadi salah ketik di /admin
-- tidak bisa menggantung halaman.
--
-- Ditulis terhadap nilai appearance LIVE (dibaca 2026-08-06, versi 340).
-- Terapkan dengan:
--   wrangler d1 execute portfolio-content --remote --file migrations/0017_launch_settings.sql
-- Jangan `d1 migrations apply --remote`.
INSERT OR REPLACE INTO content (key, value, updated_at) VALUES ('appearance', '{"background":"sparkle-grid","launch":{"on":true,"n":400,"spread":140,"bright":1,"mix":0.5,"dur":4.6}}', 1786007227);
UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'version';
