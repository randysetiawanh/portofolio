# 002 — Konten dan D1

Kode: `src/content.ts`, `migrations/0001_init.sql`, fungsi `renderPage()` di
`src/index.ts`.

## Skema

Tiga tabel, semuanya sederhana:

```sql
content (key TEXT PK, value TEXT, updated_at INTEGER)
media   (key TEXT PK, name TEXT, type TEXT, size INTEGER, uploaded_at INTEGER)
meta    (key TEXT PK, value TEXT)
```

Konten **tidak dinormalisasi**. Tiap section disimpan sebagai satu blob JSON di
kolom `value`. Alasannya: bentuk datanya dalam dan dwibahasa — satu proyek
membawa array `hi` dan `screens` dalam dua bahasa sekaligus — dan selalu dibaca
serta ditulis utuh. Menormalisasi itu berarti belasan tabel join untuk data yang
tidak pernah di-query per-baris.

## 14 section

Daftar kanoniknya ada di `SECTIONS` (`src/content.ts:9`). Endpoint
`PUT /api/admin/section/:key` menolak key di luar daftar ini.

| Key | Isi |
|---|---|
| `identity` | Wordmark, eyebrow items, baris posisi di hero |
| `i18n` | Semua prosa dwibahasa, sebagai `{key: [en, id]}` |
| `domains` | Kotak domain di diagram sistem |
| `projects` | Register proyek beserta detail panelnya |
| `layers` | Lapis teknologi dan itemnya |
| `timeline` | Entri riwayat (kerja / program / pendidikan) |
| `services` | Penawaran, ditulis dari sudut masalah klien |
| `practice` | Catatan "working together" |
| `stats` | Angka di counter strip |
| `credentials` | Stempel sertifikat |
| `contact` | Rute kontak langsung |
| `footer` | Baris title block |
| `appearance` | Pilihan pattern latar |
| `seo` | Judul, deskripsi, kartu link preview |

## Dwibahasa

Ada dua bentuk yang hidup berdampingan, dan ini gampang bikin salah:

- Dokumen `i18n` memakai **array**: `{"h.work": ["Work", "Karya"]}` — indeks 0
  Inggris, indeks 1 Indonesia. Dipakai `tr()` di script halaman.
- Section terstruktur memakai **objek**: `{"en": "...", "id": "..."}` — misalnya
  `project.sum`, `domain.label`, `layer.n`.

Jangan tertukar. `tr()` akan mengembalikan `undefined` diam-diam untuk objek,
dan renderer section akan menampilkan `undefined` untuk array.

## Versioning dan cache

`meta.version` dinaikkan setiap kali sebuah section disimpan. Nilainya
dikirim balik sebagai header `x-content-version` di response halaman, jadi bisa
dipakai untuk memastikan konten yang sedang tayang.

Cache-nya **per-isolate**, bukan global (`src/content.ts:22`):

- TTL 10 detik. Cukup pendek supaya editan cepat kelihatan, cukup panjang untuk
  menyerap ledakan page view dengan satu pembacaan D1.
- `writeSection()` mengosongkan cache, tapi hanya di isolate yang menangani
  penyimpanan. Isolate lain tetap menyajikan konten lama sampai TTL habis.
  **Itu memang perilaku yang diinginkan** — jangan "perbaiki" dengan
  broadcast invalidation; efeknya cuma jeda maksimal 10 detik.
- `readAll(db, true)` melewati cache. Dipakai admin supaya editor selalu memuat
  keadaan terbaru.

Shell HTML juga di-cache per-isolate (`shellCache`, `src/index.ts:110`) tanpa
TTL sama sekali. Aman karena deploy melahirkan isolate baru. Kalau suatu saat
shell perlu berubah tanpa deploy, ini yang pertama harus dibongkar.

## Injeksi ke shell

`renderPage()` melakukan tiga hal di satu titik `<!--content-slot-->`:

1. `<script>window.__CONTENT__=...</script>`
2. `<style>` berisi pattern latar dari `pageStyle()`
3. `<script>` yang menyetel `data-bg` di `<html>`

Ketiganya di `<head>` supaya cat pertama sudah benar — tidak ada kedipan latar
default sebelum pattern pilihan diterapkan.

Dua pengamanan yang jangan dihapus:

- Payload JSON dilewatkan `.replace(/</g, "\\u003c")`. Tanpa itu, string konten
  yang mengandung `</script>` menutup tag lebih awal dan sisanya masuk sebagai
  markup.
- Penanda yang dicari adalah komentar khusus `<!--content-slot-->`, bukan pola
  `<script>`. Beberapa script sekarang dibuka dengan cara yang sama, dan
  `String.replace` akan diam-diam mengenai yang salah.

Kalau slot-nya hilang, halaman tetap disajikan tanpa konten dan error dicatat ke
console — tidak melempar 500.

## Rules

- **R-011** — Section baru wajib didaftarkan di `SECTIONS`. Tanpa itu,
  penyimpanan dari admin ditolak 400 dan tidak ada pesan yang menjelaskan
  kenapa.
- **R-012** — Konten selalu ditulis utuh per section. Jangan menambahkan
  endpoint patch parsial; seluruh admin mengandalkan baca-ubah-tulis penuh.
- **R-013** — Prosa masuk ke `i18n` dengan bentuk array `[en, id]`. Data
  terstruktur memakai objek `{en, id}`. Jangan mencampur bentuk di satu dokumen.
- **R-014** — Setiap penyimpanan harus menaikkan `meta.version`. `writeSection()`
  sudah melakukannya dalam satu `batch`; kalau menulis ke `content` dari tempat
  lain, ikut naikkan versinya.
- **R-015** — Baris JSON yang rusak tidak boleh menjatuhkan halaman.
  `readAll()` menangkap parse error per baris dan menyetel nilainya `null`.
  Pertahankan sifat itu.
- **R-016** — Payload yang disuntik ke halaman harus tetap meng-escape `<`.
- **R-017** — Jangan naikkan TTL cache di atas 10 detik tanpa alasan. Editor
  menjanjikan "live in a few seconds" ke pemakainya.
