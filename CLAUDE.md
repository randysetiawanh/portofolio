# rancores.space — aturan project

Portofolio pribadi di Cloudflare Workers. Shell statis, konten di D1, media di
R2, editor di balik Cloudflare Access.

@.internal-docs/INDEX.md

Commit sendiri: diizinkan.

Aturan global berlaku penuh. Aturan khas project ini **tidak ditulis di sini** —
semuanya hidup sebagai `R-xxx` di dalam `.internal-docs/`, satu namespace untuk
seluruh folder, terpakai sampai R-179. File ini cuma memuat yang perlu dibaca
sebelum indeksnya dibuka.

---

## R-169 — Baca dokumennya dulu, jangan menyimpulkan dari kode

`.internal-docs/INDEX.md` punya kolom "kapan dibaca". Buka dokumen yang relevan
dengan tugasnya sebelum menyentuh apa pun.

**Alasan:** repo ini menyimpan banyak keputusan yang terlihat seperti kesalahan
kalau alasannya tidak diketahui — build legacy PDF.js, panel CV yang sengaja
tidak ada, cache `no-store` di halaman. Semuanya sudah pernah dibalik oleh orang
yang tidak tahu, dan dibalik lagi.

## R-170 — Pengecualian komentar berlaku di repo ini

Repo ini **boleh** berkomentar, dengan syarat komentarnya menjawab *kenapa*.
Ini pengecualian tertulis terhadap Aturan Global R-2, diputuskan 6 Agustus 2026
dan dicatat penuh di `017-komentar-di-repo-ini.md` (R-136 sampai R-138).

**Alasan:** repo ini publik dan URL-nya ada di CV. Pembacanya bukan cuma sesi
berikutnya — ada orang yang membuka repo untuk menilai cara kerja, dan
`.internal-docs/` yang gitignored tidak menjangkau mereka. Komentar yang cuma
menarasikan ulang kode tetap dihapus.

## R-171 — Push sebelum berhenti, pull sebelum mulai

Project ini dikerjakan dari dua mesin, laptop dan VPS. Buka sesi dengan
`git fetch`, tutup dengan push. Sebelum melanjutkan sebuah fitur, pastikan fitur
itu masih ada di `origin/main`.

**Alasan:** laptop pernah menyimpan 4 commit tanpa push selama berhari-hari
sementara VPS mendorong 12, dan akibatnya bukan konflik teks biasa — laptop
terus mengembangkan panel CV yang sudah dihapus di main enam hari sebelumnya.
Detail dan jebakan turunannya di `020-kerja-dua-mesin.md`.

## R-179 — `.internal-docs/` disalin manual, git tidak membawanya

Folder ini gitignored. Salin dengan `rsync -av --delete` ke mesin seberang
**sebelum** push, dan tulis dokumen hanya di satu mesin per sesi.

**Alasan:** `git pull` di mesin seberang akan menghapus `portofolio-docs/` yang
lama tanpa menerima penggantinya, jadi mesin itu bisa kehilangan seluruh bank
memory-nya. Salinan satu arah dengan `--delete` juga menimpa tanpa peringatan
kalau kedua mesin sama-sama menulis. Prosedur lengkapnya di
`020-kerja-dua-mesin.md` (R-176 sampai R-178).
