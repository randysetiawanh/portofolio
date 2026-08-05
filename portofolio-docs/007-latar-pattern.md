# 007 — Pattern latar

Kode: `src/patterns.ts` (323 baris), dipakai `renderPage()` dan `ADMIN_HTML`.

## Kenapa satu file

Pattern didefinisikan sekali dan dipakai dua kali: Worker menyuntikkannya ke
halaman lewat `pageStyle()`, dan admin merender deklarasi **yang sama persis**
sebagai swatch lewat `swatchStyle()`.

Dua salinan pasti melenceng cepat atau lambat, dan picker yang berbohong soal
apa yang sedang dipilih lebih buruk daripada tidak ada picker sama sekali.

## Bentuk data

```ts
interface Pattern {
  id: string;
  label: string;
  note: string;
  css: string;          // deklarasi untuk halaman / swatch
  cssLight?: string;    // override tema terang
}
```

`cssLight` ada karena sebagian pattern menaruh warna garis langsung di dalam
data-URI SVG. Warna itu tidak bisa mewarisi custom property, jadi harus ditulis
ulang untuk tema terang.

Pattern dibangun dari helper: `ISO()` untuk grid isometrik,
`circuitSvg()`, `sparkleTile()`, `asteriskTile()`, `khatamTile()`,
`constellationTile()`, `STARFIELD()`. Semuanya merakit string CSS lewat
konkatenasi.

## Bahaya konkatenasi

Karena dirakit dari potongan string, satu separator nyasar menghasilkan CSS yang
tidak parse sebagai apa pun — pattern-nya hilang diam-diam, tanpa error di
console. Gate pre-deploy karena itu memeriksa deklarasi `css:` / `cssLight:`
untuk separator ganda (`;,` atau `,;`) dan kurung yang tidak seimbang.

## Pemilihan dan pemasangan

Pilihan disimpan di dokumen `appearance` sebagai `{background: "<id>"}`.

`renderPage()` memvalidasi id itu terhadap daftar `PATTERNS`; kalau tidak
dikenal, jatuh ke `"grid"`. Nilainya dipasang sebagai atribut `data-bg` di
elemen `<html>` lewat script kecil **di `<head>`**, bukan di script halaman —
supaya tidak ada kedipan pattern default sebelum pilihan diterapkan.

Admin menerima daftar pattern lewat placeholder `/*__PATTERN_DATA__*/` yang
diganti Worker jadi `window.__PATTERNS__` berisi `{id, label, note}` saja.
CSS-nya masuk terpisah lewat `/*__SWATCH_CSS__*/`.

## Rules

- **R-067** — Pattern didefinisikan hanya di `src/patterns.ts`. Jangan menyalin
  deklarasinya ke `index.html` atau ke admin.
- **R-068** — Swatch admin wajib memakai deklarasi yang sama dengan halaman.
  Kalau preview dan hasil bisa berbeda, itu bug.
- **R-069** — Pattern yang menaruh warna di dalam SVG wajib punya `cssLight`.
- **R-070** — Id pattern divalidasi terhadap `PATTERNS` sebelum dipakai; nilai
  tak dikenal jatuh ke `grid`.
- **R-071** — `data-bg` dipasang di `<head>`, tidak boleh dipindah ke script
  halaman.
- **R-072** — Setelah menambah atau mengubah pattern, jalankan `npm run check`.
  Kesalahan konkatenasi tidak memunculkan error apa pun saat runtime.
