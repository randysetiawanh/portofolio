# 004 — Media di R2

Kode: `safeMediaKey()` di `src/content.ts`, `serveMedia()` dan cabang
`/api/admin/media` di `src/index.ts`, `mediaPanel()` / `openPicker()` di
`src/admin-ui.ts`.

## Bentuk

File disimpan di bucket R2 `portfolio-media`, disajikan lewat `/m/<key>`.
Tabel `media` di D1 adalah **mirror**, bukan sumber kebenaran — isinya nama,
tipe, ukuran, dan waktu unggah, supaya admin bisa menampilkan daftar tanpa
mem-paging bucket.

Empat folder yang diizinkan, dan cuma empat:

| Folder | Isi |
|---|---|
| `logo/` | Logo organisasi di timeline |
| `porto/` | PDF portofolio per proyek |
| `img/` | Potret, gambar OG, gambar lepas |
| `cv/` | CV yang bisa diunduh |

## `safeMediaKey()`

Nama file berasal dari pengguna, jadi dinormalisasi keras:

- Folder dibersihkan ke `[a-z0-9-]`, di-lowercase, lalu harus lolos allowlist.
  Di luar empat itu → `null` → `400`.
- Nama file di-lowercase, karakter di luar `[a-z0-9.\-_]` jadi `-`, deret `-`
  dirapatkan, `-` dan `.` di ujung dibuang, dipotong 80 karakter.
- Hasil kosong atau mengandung `..` → `null`.

Key akhirnya selalu `folder/nama`. Tidak ada path traversal karena `/` bukan
karakter yang lolos filter.

## Penyajian

`serveMedia()` mengambil objek dari R2, menyalin metadata HTTP-nya, memasang
`etag`, dan `cache-control: public, max-age=300`. Kalau `if-none-match` cocok,
balas `304` tanpa body.

Cache lima menit itu kompromi: cukup untuk menahan beban, cukup pendek supaya
file yang diganti dengan nama sama muncul dalam waktu wajar.

## Unggah

`POST /api/admin/media` menerima `multipart/form-data` dengan `file` dan
`folder`. Batasnya 15 MB (`MAX_UPLOAD`). File di-stream ke R2, lalu barisnya
di-`INSERT OR REPLACE` ke tabel mirror. Response `{ok, key, path}` — `path`
sudah dalam bentuk `/m/<key>`, siap ditempel ke field.

Mengunggah dengan nama yang sama **menimpa** file lama, tanpa peringatan.
Itu sengaja: mengganti logo cukup unggah ulang dengan nama sama, semua referensi
tetap benar.

## Hapus

`DELETE /api/admin/media?key=` menghapus dari R2 dan dari tabel mirror, lalu
memanggil `bustCache()`. Yang **tidak** dilakukan: mencari referensi ke file itu
di dokumen konten. Menghapus file yang masih dipakai menghasilkan gambar rusak
atau tautan 404 di halaman, dan tidak ada yang memperingatkan.

## Rules

- **R-037** — Folder media terbatas pada `logo`, `porto`, `img`, `cv`.
  Kalau perlu folder baru, tambahkan ke allowlist di `safeMediaKey()` **dan** ke
  daftar folder di `mediaPanel()`; keduanya terpisah dan gampang lupa.
- **R-038** — Semua key media harus lewat `safeMediaKey()`. Jangan pernah
  memakai `file.name` langsung sebagai key R2.
- **R-039** — Tabel `media` adalah mirror. Kalau menulis ke R2 dari jalur baru,
  tulis juga barisnya; kalau tidak, file itu tidak akan pernah muncul di picker.
- **R-040** — Sebelum menghapus media, cek dulu apakah key-nya masih
  direferensikan di dokumen konten. Sistemnya tidak memeriksa itu untukmu.
- **R-041** — Batas unggah 15 MB. Kalau dinaikkan, ingat Worker punya batas
  memori sendiri dan file di-stream, bukan di-buffer — jangan mengubahnya jadi
  `arrayBuffer()`.
