# 005 — Halaman publik

Kode: `public/index.html` (1766 baris), `public/404.html`.

## Bahasa desain

Halaman digambar sebagai **satu set dokumen teknik**, bukan sebagai landing page:
diagram sistem, register proyek, tabel spesifikasi, dan title block gambar
teknik di kaki halaman. Ini keputusan sadar dan berakar pada domain kerjanya
sendiri — bukan dari katalog gaya.

Sebagian besar sistem yang dikerjakan tidak punya URL publik, jadi situs ini
menunjukkan **bentuk** sistemnya, bukan tangkapan layarnya. Gambar proyek adalah
redrawing abstrak — lihat [012-kebijakan-disclosure.md](012-kebijakan-disclosure.md).

Font: Archivo (variable) untuk teks, IBM Plex Mono untuk label dan angka.
Keduanya file `.woff2` di `public/fonts/` dengan `preload`.

## Struktur

Urutan section di `<body>`:

| Anchor | Isi |
|---|---|
| `#hero` | Eyebrow, wordmark, pernyataan pembuka, tabel posisi, diagram sistem |
| `#ticker` | Pita berjalan |
| — | Counter strip (`#stats`) |
| `#services` | Penawaran |
| `#profile` | Bio, tabel spesifikasi, potret |
| `#path` | Timeline gantt |
| `#work` | Register proyek |
| `#stack` | Lapis teknologi |
| — | Quality (latar belakang testing) |
| `#how` | Working together |
| — | Credentials (stempel) |
| `#contact` | Form dan rute langsung |
| — | Title block (`#tblock`) |

Elemen lepas: `#drawer` (panel detail proyek), `#peek` (pratinjau hover),
`#tip` (tooltip timeline), `#scrim`.

## Script halaman

Satu IIFE `"use strict"` di akhir body. Polanya konsisten: baca dari `CONTENT`,
bangun DOM lewat fungsi `buildX()`.

```
CONTENT = window.__CONTENT__
  ├─ DOMAINS, P (projects), LAYERS, TIMELINE, T (i18n)
  ├─ buildMap()      diagram SVG dengan animasi draw-in
  ├─ buildReg()      register proyek
  ├─ buildLayers()   lapis teknologi
  ├─ buildPath()     gantt timeline
  ├─ buildIdentity() buildPosition() buildStats() buildStamps()
  ├─ buildDirect()   buildFooter() buildOffers() buildPractice()
  ├─ fillDrawer() / openDrawer() / closeDrawer()
  └─ paintViews()    counter dari /api/views
```

Ditulis dengan `var` dan `function`, bukan ES modern — sengaja, karena tidak ada
transpiler dan file ini di-parse langsung browser.

## i18n dan pergantian bahasa

`tr(key)` membaca `T[key]` dan mengambil indeks 0 (EN) atau 1 (ID). Elemen
dengan atribut `data-t` diisi otomatis oleh `applyLang()`.

Yang penting: `applyLang()` **membangun ulang** hampir semua section, tapi
diagram sistem hanya di-relabel di tempat. Membangun ulang diagram akan memutar
ulang animasi draw-in setiap kali bahasa diganti — itu jelek, jadi jangan
disederhanakan jadi rebuild penuh.

`applyLang()` memakai `innerHTML`, bukan `textContent`, supaya prosa boleh
memuat markup inline. Artinya konten `i18n` **dipercaya** — konsisten dengan
kenyataan bahwa hanya pemilik yang bisa melewati Access.

## Tema

Gelap adalah basis. Tidak ada `prefers-color-scheme` sama sekali; pilihan tema
disimpan di `localStorage` dan dibaca oleh bootstrap kecil di `<head>` sebelum
apa pun dicat. Gate pre-deploy memeriksa ketiga hal ini.

`prefers-reduced-motion` dihormati (`RM` di baris 998) dan mematikan animasi.

## Anggaran ukuran

Shell sekarang ~109 KB dengan ~32 KB CSS render-blocking. Sebelumnya font
di-inline sebagai base64 dan angkanya 250 KB / 174 KB. Jangan meng-inline font
lagi.

## Rules

- **R-045** — Tidak ada teks konten di `index.html`. Yang ada di sana hanya
  markup struktural, label `data-t`, dan fallback SEO.
- **R-046** — Script halaman ditulis ES5-ish (`var`, `function`). Tidak ada
  transpiler; sintaks yang gagal di-parse menjatuhkan seluruh halaman.
- **R-047** — Diagram sistem di-relabel saat ganti bahasa, tidak dibangun ulang.
- **R-048** — Gelap adalah basis tema. Jangan menambahkan
  `prefers-color-scheme`; gate pre-deploy akan menolaknya.
- **R-049** — Bootstrap tema harus tetap satu kali dan berada di `<head>`.
- **R-050** — `prefers-reduced-motion` wajib tetap dihormati di animasi baru.
- **R-051** — Font tetap file eksternal dengan `preload`. Jangan di-base64.
- **R-052** — Tidak ada CSS di `<body>`. Seluruh stylesheet berada dalam satu
  blok `<style>` di `<head>`; gate memeriksa keduanya.
- **R-053** — Kalau menambah section, tambahkan juga entri navigasinya di
  `FIELDS.nav` supaya labelnya bisa diedit dan diterjemahkan.
- **R-054** — Section Path punya dua layout yang berbagi satu markup. Sebelum
  menyentuhnya, baca [014-path-layar-sempit.md](014-path-layar-sempit.md).
