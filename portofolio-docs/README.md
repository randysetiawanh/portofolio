# portofolio-docs

Memory eksekusi untuk project `portofolio` (rancores.space). Baca dokumen yang
relevan **sebelum** menyentuh kode — dokumen ini sumber konteks utama, bukan
kodenya.

Beda dengan `README.md` di root repo: README itu untuk orang lain yang mau
membaca atau mendirikan ulang situsnya. Folder ini untuk sesi berikutnya yang
mau **mengubah** sesuatu, dan berisi alasan serta jebakan yang tidak layak
ditulis di README publik.

## Indeks

| Dokumen | Isi |
|---|---|
| [001-arsitektur.md](001-arsitektur.md) | Bentuk sistem, routing, alur request, kenapa static-first |
| [002-konten-dan-d1.md](002-konten-dan-d1.md) | Content store, 14 section JSON, versioning, cache |
| [003-admin-dan-access.md](003-admin-dan-access.md) | `/admin`, verifikasi Access, admin API, skema FIELDS |
| [004-media-r2.md](004-media-r2.md) | Upload, `safeMediaKey`, `/m/*`, tabel mirror |
| [005-halaman-publik.md](005-halaman-publik.md) | Shell `index.html`, struktur section, script halaman, i18n, tema |
| [006-seo-dan-sharing.md](006-seo-dan-sharing.md) | Dokumen `seo`, `seoBlock`, marker splice, link preview |
| [007-latar-pattern.md](007-latar-pattern.md) | `patterns.ts`, satu sumber untuk halaman dan swatch admin |
| [008-api-publik.md](008-api-publik.md) | `/api/views`, `/api/contact`, `/api/content`, view counter |
| [009-gate-pre-deploy.md](009-gate-pre-deploy.md) | `check-shell.mjs`, 33 assertion, kenapa ada |
| [010-migrasi-konten.md](010-migrasi-konten.md) | Migration 0001–0013 dan konvensi migrasi konten |
| [011-deploy-dan-operasional.md](011-deploy-dan-operasional.md) | Perintah, binding, secret, batas free tier |
| [012-kebijakan-disclosure.md](012-kebijakan-disclosure.md) | Aturan penyensoran angka operasional |
| [013-utang-teknis.md](013-utang-teknis.md) | Yang belum beres, beserta risikonya |
| [014-path-layar-sempit.md](014-path-layar-sempit.md) | Gantt jadi batang durasi di bawah 820px, dan cara preview tanpa deploy |
| [015-viewer-cv-pdf.md](015-viewer-cv-pdf.md) | Sheet CV PDF.js, kenapa bukan iframe, dan panel inline yang dibuang |
| [016-tes-dan-modul-murni.md](016-tes-dan-modul-murni.md) | Pemisahan fungsi murni dari Worker, dan 45 tes tanpa dependency |
| [017-komentar-di-repo-ini.md](017-komentar-di-repo-ini.md) | Kenapa repo ini boleh berkomentar, dan batasnya |
| [018-animasi-peluncuran-hero.md](018-animasi-peluncuran-hero.md) | Roket di hero: gravity turn, offset-path, dan kenapa bukan keyframe left/top |

## Aturan folder ini

- **R-000** — Setiap fitur baru atau perubahan fitur wajib punya dokumen di sini,
  ditulis di sesi yang sama. Fitur yang tidak terdokumentasi dianggap hilang.
- Nomor rule (`R-xxx`) unik di seluruh folder, bukan per dokumen. Kalau menambah
  rule, ambil nomor kosong berikutnya dan catat di dokumen yang paling relevan.
- Nilai kredensial tidak pernah ditulis di sini. Yang boleh cuma letaknya.
