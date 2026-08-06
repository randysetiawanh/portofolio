# 016 — Tes dan modul murni

Dibangun 6 Agustus 2026. Kode: `src/render.ts`, `src/mail.ts`, `src/validate.ts`,
`test/*.test.ts`.

## Masalahnya

Gate pre-deploy memvalidasi shell HTML dan template admin, tapi logika Worker
tidak tersentuh sama sekali — padahal di situlah kesalahan paling mahal:
escaping atribut, normalisasi nama file, header email, batas panjang input.

Penghalangnya bukan kemalasan tapi struktur: `src/index.ts` mengimpor
`cloudflare:workers` dan `cloudflare:email`, dan Node menolak skema itu:

```
Only URLs with a scheme in: file, data, and node are supported
```

Selama fungsi murninya tinggal di file yang sama dengan import itu, tidak ada
cara mengujinya tanpa menjalankan Worker.

## Pemisahan

Fungsi murni dipindah ke modul yang **tidak mengimpor apa pun dari `cloudflare:`**:

| Modul | Isi |
|---|---|
| `src/render.ts` | `attr()`, `seoBlock()`, tipe `Seo` |
| `src/mail.ts` | `headerSafe()`, `base64()`, `encodeHeader()`, `buildMime()` |
| `src/validate.ts` | `MAX`, `validateContact()` |
| `src/content.ts` | `safeMediaKey()` — sudah murni sejak awal |

`src/index.ts` mengimpor balik dari situ. `handleContact()` sekarang memanggil
`validateContact(body)` yang mengembalikan discriminated union
(`{ok:true, fields}` atau `{ok:false, error, status}`), jadi kode status dan
pesan error jadi data yang bisa diperiksa, bukan cabang `return` yang tersebar.

**Aturan yang menjaga ini tetap bisa diuji:** modul di tabel itu tidak boleh
mengimpor `cloudflare:*`. Begitu satu import masuk, seluruh berkas tesnya mati.

## Menjalankan

```bash
npm test        # node --test "test/*.test.ts"
```

Tanpa dependency baru. Node 24 sudah bisa menjalankan TypeScript langsung
(type stripping bawaan), dan test runner-nya `node:test` bawaan. Di VPS dengan
RAM 1.9 GB itu penting — tidak ada vitest, tidak ada jest, tidak ada transpiler.

`package.json` diberi `"type": "module"`, kalau tidak Node memarahi tiap impor
`.ts` dan mem-parse ulang sebagai ESM.

Tes ikut ke `predeploy`, jadi urutannya: **tes → gate shell → deploy**.

## Cakupan

45 tes, 4 berkas.

- **`validate.test.ts`** — field kosong, field hilang, spasi saja, tepat pada
  batas, melewati batas, bentuk email, dan **urutan pemeriksaan**: payload
  raksasa yang juga bukan email harus dijawab `413`, bukan `400`, supaya regex
  tidak pernah menyentuh megabyte kiriman.
- **`media.test.ts`** — allowlist folder, normalisasi, pemotongan 80 karakter,
  dan invarian keamanannya.
- **`render.test.ts`** — escaping empat karakter, fallback saat `seo` kosong,
  absolutisasi URL, pemilihan `summary` vs `summary_large_image`.
- **`mail.test.ts`** — `headerSafe()` terhadap CRLF injection, base64 UTF-8,
  RFC 2047, pemisah header/body, patahan 76 karakter, keunikan `Message-ID`.

## Dua temuan dari menulis tesnya

Keduanya adalah asumsi **tes** yang salah, bukan bug di kode — dan justru itu
yang membuatnya layak dicatat.

**`safeMediaKey()` menormalkan, tidak menolak.** `../../etc/passwd` menghasilkan
`img/etc-passwd`, bukan `null`. Itu benar: unggahan dari Finder atau Windows
Explorer penuh karakter aneh yang bukan serangan, dan menolaknya bikin panel
media rewel tanpa alasan. Yang dijamin bukan "input jahat ditolak" tapi **"key
yang keluar selalu jinak"** — tepat satu garis miring, folder dari allowlist,
tanpa `..`. Tesnya menegakkan invarian itu, bukan menyamakan dengan `null`.

**Folder juga dinormalkan.** `../logo` menyusut jadi `logo` karena titik dan
garis miring dibuang, jadi hasilnya `logo/a.png`. Sementara `img/../cv` menyusut
jadi `imgcv`, yang tidak ada di allowlist, jadi `null`.

## Rules

- **R-139** — `src/render.ts`, `src/mail.ts`, dan `src/validate.ts` tidak boleh
  mengimpor `cloudflare:*`. Itu satu-satunya hal yang membuatnya bisa diuji.
- **R-140** — Fungsi murni baru ditaruh di salah satu modul itu, bukan di
  `src/index.ts`.
- **R-141** — Tes menegakkan **invarian**, bukan nilai kembalian harfiah.
  Untuk `safeMediaKey()` yang dijamin adalah bentuk key yang keluar.
- **R-142** — `npm test` jalan sebelum `npm run check` di `predeploy`. Jangan
  balik urutannya: tes lebih murah dan lebih cepat gagal.
- **R-143** — Tidak menambah dependency untuk testing. Node bawaan cukup, dan
  VPS-nya cuma 1.9 GB.
