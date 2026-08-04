# Fonts

Both faces are latin-subset WOFF2 builds. Subsetting drops the font's internal
name and licence tables, so the licences travel beside the files instead.

| File | Face | Licence |
|---|---|---|
| `archivo-var.woff2` | Archivo (variable weight + width) | [OFL 1.1](OFL-Archivo.txt) — © 2020 The Archivo Project Authors |
| `plexmono-400.woff2`, `plexmono-500.woff2` | IBM Plex Mono | [OFL 1.1](OFL-IBMPlex.txt) — © 2017 IBM Corp., Reserved Font Name "Plex" |

Both are preloaded from `<head>`; the page holds its layout during the swap, so
nothing reflows when they arrive.

Archivo carries a width axis, which is what lets the wordmark stretch to fill
its column. Plex Mono was drawn for IBM's systems documentation — it is doing
the same job here.
