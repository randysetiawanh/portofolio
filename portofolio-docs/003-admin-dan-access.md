# 003 — Admin dan Cloudflare Access

Kode: `src/admin-ui.ts` (870 baris), `src/access.ts` (136 baris), fungsi
`handleAdminApi()` di `src/index.ts`.

## Kenapa admin di-bundle ke Worker

`ADMIN_HTML` adalah satu template string raksasa di `src/admin-ui.ts`, bukan file
di `public/`. Alasannya: aset statis bisa di-fetch langsung dari edge, dan
routing aset bukan sesuatu yang layak dijadikan tumpuan keamanan panel admin.
Sebagai kode Worker, satu-satunya jalan ke sana adalah route yang memeriksa
Access lebih dulu.

Efek sampingnya: template itu tidak pernah di-parse browser sampai
di-deploy dan dibuka lewat Access. Itu sebabnya gate pre-deploy ikut memeriksa
script di dalamnya — lihat [009-gate-pre-deploy.md](009-gate-pre-deploy.md).

## Verifikasi Access

`verifyAccess()` memeriksa JWT yang dipasang Cloudflare Access, diambil dari
header `cf-access-jwt-assertion` atau cookie `CF_Authorization`. Urutannya:

1. `ACCESS_TEAM_DOMAIN` dan `ACCESS_AUD` harus keduanya terisi — kalau tidak,
   langsung `null`.
2. Token harus tiga bagian, header harus `alg: RS256` dan punya `kid`.
3. Kunci publik diambil dari `https://<team>/cdn-cgi/access/certs`, di-import
   sebagai RSASSA-PKCS1-v1_5 / SHA-256, di-cache per isolate selama 1 jam.
4. Signature diverifikasi terhadap `header.payload`.
5. `exp` harus di masa depan; `nbf` (kalau ada) tidak boleh lebih dari 60 detik
   di depan; `iss` harus persis `https://<team>`; `aud` harus memuat
   `ACCESS_AUD`.

Kembaliannya email yang terverifikasi, atau `null`.

**Fail closed itu inti desainnya.** Konfigurasi setengah jadi mengunci pintu,
bukan membukanya. Kalau `ACCESS_TEAM_DOMAIN` atau `ACCESS_AUD` kosong, router
menjawab `503 Admin is closed`; kalau terisi tapi verifikasi gagal, `403 Not
authorised`.

Header saja tidak pernah dipercaya. Siapa pun bisa mengirim
`cf-access-jwt-assertion` — yang membuatnya berarti hanyalah signature yang
diperiksa.

## Admin API

Semua di bawah `/api/admin`, semuanya lewat gate yang sama.

| Route | Method | Perilaku |
|---|---|---|
| `/api/admin/state` | GET | `{email, content, media}` — konten dibaca dengan `force=true` |
| `/api/admin/section/:key` | PUT | Body JSON disimpan utuh ke section itu |
| `/api/admin/media` | POST | `multipart/form-data` dengan `file` dan `folder` |
| `/api/admin/media?key=` | DELETE | Hapus dari R2 dan tabel mirror |

## Struktur editor

Editor menyusun dirinya dari data, bukan dari markup statis:

- **`TABS`** — daftar tab beserta `hint` dan bagian-bagiannya. Tiap bagian
  adalah pasangan `[judul, fungsi pembuat]`.
- **`FIELDS`** — skema untuk prosa `i18n`. Satu baris = satu string editable,
  bentuknya `["Label", "kunci.i18n", multiline?]`. `i18nGroup()` merendernya jadi
  sepasang input EN/ID.
- **`listEditor()`** — editor list generik: kartu bisa dilipat, tombol naik,
  turun, hapus, dan tambah. Dipakai proyek, timeline, layer, domain, services,
  practice, stats, credentials, contact, footer, eyebrow, position.
- **`mediaField()`** — input teks dengan tombol **Browse** yang membuka pemilih
  media dan bisa mengunggah di tempat. Dipakai di mana pun path file
  direferensikan.

Konsekuensi praktis: **menambah string editable = satu baris di `FIELDS`**,
bukan form baru.

## Tombol Save menyimpan semuanya

Tombol Save di tab mana pun menyimpan **seluruh** section di `SAVE_ALL`, bukan
cuma yang sedang dibuka. Ini disengaja — state editor dipegang di memori sebagai
satu objek, dan pengguna bisa mengubah beberapa tab sebelum menekan Save.

Jebakannya: kalau dua tab admin dibuka bersamaan di dua browser, yang menyimpan
belakangan menimpa seluruh perubahan yang pertama. Tidak ada penguncian dan
tidak ada deteksi konflik.

## Nilai dwibahasa di tab Contact

Baris kontak menyimpan teks tampil sebagai **string biasa** kalau bacaannya sama
di dua bahasa (alamat email, nomor telepon), dan sebagai `{en,id}` kalau tidak —
baris CV berbunyi "See PDF" / "Lihat PDF" sejak migration `0014`.

Editornya sempat tertinggal: satu field tunggal merender objek itu jadi
`[object Object]`, dan satu ketikan di situ mengubahnya jadi string, diam-diam
membuang label Indonesia. Diperbaiki 6 Agustus 2026 — sekarang ada sepasang
field EN/ID, dan penulisannya balik jadi string kalau keduanya sama.

Flag `viewer` juga tidak punya kontrol sama sekali; sekarang ada checkbox
"Opens the in-page PDF viewer".

**Pelajarannya:** migration yang mengubah *bentuk* sebuah dokumen wajib diikuti
penyesuaian editornya di sesi yang sama. Kalau tidak, editornya berbohong dan
satu penyimpanan bisa merusak data yang baru saja dimigrasikan.

## Tab Advanced

Tab `raw` menampilkan JSON mentah tiap section dengan tombol simpan per section.
Ini escape hatch untuk apa pun yang belum punya form. JSON divalidasi di klien
sebelum dikirim, dan `PUT` menolak body yang bukan JSON valid.

## Rules

- **R-023** — `ADMIN_HTML` tidak boleh dipindah ke `public/`. Itu membuang
  seluruh alasan panel ini aman.
- **R-024** — Verifikasi Access harus tetap fail closed. Jangan menambahkan
  cabang "kalau belum dikonfigurasi, izinkan" untuk memudahkan development.
- **R-025** — Jangan pernah mempercayai header Access tanpa memverifikasi
  signature, issuer, audience, dan expiry.
- **R-026** — Setiap route baru yang menyentuh data admin harus berada di bawah
  prefix `/api/admin` supaya otomatis ikut ke gate. Jangan bikin gate kedua.
- **R-027** — String editable baru ditambahkan sebagai satu baris di `FIELDS`,
  bukan sebagai form khusus.
- **R-028** — Kunci `i18n` yang sudah tidak dirender halaman harus dihapus lewat
  migration, bukan dibiarkan. Field yang tidak mengubah apa pun membohongi
  pemakainya — lihat migration `0008` dan `0010`.
- **R-029** — Path file tidak pernah diketik manual di editor. Kalau menambah
  field yang menunjuk file, pakai `mediaField()` dengan folder yang benar.
- **R-030** — Section baru wajib dimasukkan ke `SAVE_ALL`, kalau tidak
  perubahannya tidak pernah tersimpan meski formnya jalan.
- **R-031** — Jangan membuka admin di dua tab sekaligus. Save terakhir menang
  dan menimpa seluruh section.
- **R-032** — Migration yang mengubah bentuk sebuah dokumen wajib diikuti
  penyesuaian editornya di sesi yang sama.
- **R-033** — Field yang bisa berisi `{en,id}` dirender sebagai sepasang input,
  tidak pernah sebagai satu field.
