# 013 — Utang teknis

Daftar hal yang belum beres per 4 Agustus 2026, diurutkan dari yang paling
berisiko. Bukan backlog fitur — ini yang sudah diketahui bermasalah.

## 1 · Deploy dari dua tempat tanpa git di tengahnya

`origin` sudah tersambung ke `github.com/randysetiawanh/portofolio` (5 Agustus
2026), jadi risiko kehilangan repo sudah lewat. Yang tersisa lebih halus dan
sudah sempat menggigit.

Pada 5 Agustus 2026 laptop dan VPS sama-sama men-deploy ke Worker yang sama.
Laptop bercabang dari commit lama, jadi deploy-nya mengunggah pohon yang tidak
tahu perubahan VPS ada — dan tiga perbaikan yang sudah tayang **hilang dari
produksi tanpa error apa pun**. Ketahuan hanya karena bug yang sudah diperbaiki
muncul lagi.

Yang bikin ini mungkin: perubahan di-deploy sebelum masuk git. Selama itu terjadi,
produksi bisa lebih maju daripada semua branch sekaligus, dan tidak ada jalan
rollback.

**Aturannya sekarang: commit dulu, baru deploy.** Sebelum `npm run deploy`,
pastikan `git status` bersih dan branchnya sudah sinkron dengan `origin/main`.

## 2 · Logika Worker tidak punya tes

`npm run check` memvalidasi shell HTML dan template admin. Yang **tidak**
tersentuh sama sekali justru bagian yang paling gampang salah:

- `safeMediaKey()` — normalisasi nama file dari input pengguna
- `attr()` — escaping atribut
- `seoBlock()` — pembentukan URL absolut
- validasi `handleContact()` — batas panjang, format email, urutan pemeriksaan
- `buildMime()` — `headerSafe()` dan encoding non-ASCII

Semuanya fungsi murni tanpa dependency Cloudflare. Tesnya murah; ketiadaannya
yang mahal.

## 3 · Komentar di kode vs aturan repo

`~/CLAUDE.md` menetapkan: fitur baru **tanpa komentar sama sekali**, penjelasan
pindah ke `*-docs/`. Kode di project ini justru sebaliknya — docblock di tiap
file, separator blok `/* ── … ── */`, dan komentar penjelas di `wrangler.jsonc`
serta migrations.

Ini konflik yang belum diputuskan, bukan kelalaian. Argumen untuk membiarkan:
repo ini publik dan komentarnya menjelaskan *kenapa*, bukan *apa*. Argumen untuk
membersihkan: konsistensi dengan project lain, dan LOC SonarQube.

**Butuh keputusan Randy.** Sampai itu ada, jangan menambah komentar baru dan
jangan pula membersihkan yang lama diam-diam.

## 4 · Tidak ada deteksi konflik di admin

Save di tab mana pun menyimpan seluruh `SAVE_ALL`. Dua tab admin terbuka
bersamaan berarti yang menyimpan belakangan menimpa semua perubahan yang
pertama, tanpa peringatan. `meta.version` sudah ada dan bisa dipakai sebagai
dasar optimistic locking, tapi belum dipakai untuk itu.

## 5 · Hapus media tidak memeriksa referensi

`DELETE /api/admin/media` membuang file dan barisnya tanpa mengecek apakah
key-nya masih dipakai di dokumen konten. Hasilnya gambar rusak atau tautan 404
yang baru ketahuan saat ada yang membuka halaman.

## 6 · Satu angka lolos dari kebijakan disclosure

`public/index.html:1081`, sketch `phone`: teks `65 STATE ENTERPRISES` tayang
sebagai angka mentah, padahal kebijakannya menuntut redaction bar. Perbaikannya
satu baris — lihat [012-kebijakan-disclosure.md](012-kebijakan-disclosure.md).

## 7 · `make-og.py` terikat macOS

Script gambar link preview membaca font dari `/System/Library/Fonts/`. Di Linux
— termasuk VPS ini — tidak jalan tanpa mengganti path fontnya.

## 8 · README publik vs docs

`README.md` di root ditulis dalam Bahasa Inggris untuk pembaca luar; folder ini
Bahasa Indonesia untuk sesi berikutnya. Keduanya membahas keputusan desain yang
sama, jadi berpotensi melenceng.

Pembagiannya: README menjelaskan **cara mendirikan dan memakai**; folder ini
menjelaskan **kenapa dan apa yang bikin tersandung**. Kalau sebuah fakta berubah
dan muncul di keduanya, perbarui dua-duanya di sesi yang sama.

## Rules

- **R-119** — Kalau menyentuh salah satu fungsi murni di poin 2, tulis tesnya
  sekalian.
- **R-120** — Jangan menambah komentar baru di kode sampai poin 3 diputuskan.
- **R-121** — Fakta yang muncul di `README.md` dan di folder ini diperbarui
  bersamaan.
