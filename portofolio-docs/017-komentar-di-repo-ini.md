# 017 — Komentar di repo ini

Keputusan diambil 6 Agustus 2026. Ini pengecualian tertulis terhadap aturan
global di `~/CLAUDE.md`, bukan kelalaian yang dibiarkan.

## Aturan globalnya

`~/CLAUDE.md` menetapkan: app atau fitur baru **tanpa komentar sama sekali** —
tidak docblock, tidak inline, tidak penanda blok. Penjelasan pindah ke `*-docs/`.
Alasannya: sesi berikutnya cukup membaca satu dokumen ringkas, tidak perlu
menyusuri puluhan file mencari komentar tersebar. Hemat limit, waktu, dan token.

## Kenapa repo ini dikecualikan

**Repo ini publik.** `rancores.space` dipajang sebagai contoh kerja dan URL-nya
ada di CV. Pembacanya bukan cuma sesi Claude berikutnya — ada orang yang membuka
repo untuk menilai cara kerja, dan folder `portofolio-docs/` berbahasa Indonesia
tidak menjangkau mereka.

**Komentarnya menjelaskan *kenapa*, bukan *apa*.** Contoh yang ada sekarang:

- kenapa counter memakai Durable Object dan bukan KV (batas 1.000 write/hari)
- kenapa shell tidak boleh di-memoize (isolate membeku saat deploy menyebar)
- kenapa PDF.js dan bukan `<iframe>` (Safari menolak render dalam frame)
- kenapa geometri batang lewat custom property (inline style mengalahkan CSS)

Tidak satu pun bisa disimpulkan dari kode di sebelahnya, dan semuanya lahir dari
kegagalan nyata. Menghapusnya berarti membiarkan orang berikutnya mengulang
kegagalan yang sama.

**Praktiknya sudah begitu di kedua sisi.** Kode yang ditulis di laptop maupun di
VPS sama-sama komentar-padat. Aturan yang dilanggar konsisten oleh semua pihak
bukan aturan, cuma harapan.

## Batasnya

Pengecualian ini **tidak** berarti komentar bebas. Yang berlaku:

- Komentar menjawab **kenapa**. Kalau isinya mengulang apa yang sudah jelas dari
  kode, itu bukan komentar yang dimaksud — hapus.
- Narasi tingkat fitur tetap di `portofolio-docs/`. Komentar tidak menggantikan
  dokumen; dokumen tidak menggantikan komentar.
- Komentar yang menyebut tanggal atau insiden ("it did, 2026-08-05") sangat
  dianjurkan — itu yang membuat sebuah keputusan tidak dibalik iseng.
- Pengecualian ini berhenti di repo ini. Project lain tetap ikut `~/CLAUDE.md`.

## Rules

- **R-136** — Repo ini boleh berkomentar, dengan syarat komentarnya menjawab
  *kenapa*. Ini pengecualian terhadap `~/CLAUDE.md`, berlaku hanya di sini.
- **R-137** — Komentar yang cuma menarasikan ulang kode dihapus, bukan
  dipertahankan atas nama pengecualian ini.
- **R-138** — Dokumen fitur di `portofolio-docs/` tetap wajib. Komentar bukan
  penggantinya.
- **R-120** — *(dicabut 6 Agustus 2026)* Larangan menambah komentar baru sampai
  konflik ini diputuskan. Sudah diputuskan; lihat R-136.
