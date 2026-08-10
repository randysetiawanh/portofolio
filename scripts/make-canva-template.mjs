/**
 * Build the blank portfolio sheet as a Canva-importable template.
 *
 *   node scripts/make-canva-template.mjs tmp/porto/template-canva.pdf
 *
 * This is not the project sheet — it is the empty form of it. Everything that
 * made the real sheets import badly is gone:
 *
 *   no raster at all      Canva rasterises nothing and drops nothing; every
 *                         mark in the file is a vector box or a text run.
 *   no CSS gradients      the 14mm grid was painted by a repeating gradient,
 *                         which Chromium bakes into a bitmap on print. The
 *                         grid here is drawn as real lines, so Canva sees
 *                         lines — or set GRID=0 to leave it out entirely.
 *   no dashes, no shadow  both survive PDF badly and arrive as artefacts.
 *   no SVG monogram       the R. is set as type, so it stays editable.
 *
 * Image slots are flat chroma-green blocks. Canva reads a solid filled shape
 * as one object, so each slot can be selected and replaced with a screenshot
 * in one drag — which is the whole point of handing over a template rather
 * than a finished sheet.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const out = process.argv[2] || "tmp/porto/template-canva.pdf";
const GRID = process.env.GRID !== "0";
const SHEETS = Number(process.env.SHEETS || 2);

const INK = "#080C11", PANEL = "#0E141B", RULE = "#1F2C39", DIM = "#6E8194";
const TEXT = "#DCE5ED", STRONG = "#F4F8FC", SIGNAL = "#FF7A18", STRUCT = "#3A7BFD";
const GREEN = "#00B140";                      // chroma key, unmistakably a slot

/* Real lines, not a gradient: 20 verticals and 14 horizontals is a handful of
   vector objects, where a repeating background becomes one flat bitmap. */
const grid = () => {
  if (!GRID) return "";
  let h = '<div class="grid">';
  for (let x = 1; x < 21; x++) h += `<i style="left:${x * 14}mm"></i>`;
  for (let y = 1; y < 15; y++) h += `<u style="top:${y * 14}mm"></u>`;
  return h + "</div>";
};

const cross = (pos) => `<b class="x ${pos}"><s></s><s class="v"></s></b>`;

const slot = (n) => `
  <div class="slot">
    <div class="green"><span>IMAGE ${String(n).padStart(2, "0")}</span></div>
    <div class="cap"><span class="n">${String(n).padStart(2, "0")}</span><span>SCREEN NAME</span></div>
  </div>`;

const foot = (n) => `
  <footer>
    <div><span class="lbl">Drawn by</span><span class="v">Your name</span></div>
    <div><span class="lbl">Client</span><span class="v">Client name</span></div>
    <div><span class="lbl">Role</span><span class="v">Your role</span></div>
    <div><span class="lbl">In service</span><span class="v">2026 → present</span></div>
    <div class="r"><span class="lbl">Sheet</span><span class="v">${n} / ${SHEETS}</span></div>
  </footer>`;

const head = () => `
  <header>
    <span class="mark">R<em>.</em></span>
    <span class="lbl s">PROJECT NAME</span>
    <span class="lbl dim">framework@0.0.0 · language@0.0 · database</span>
    <span class="lbl sig r">rancores.space</span>
  </header>`;

const page1 = `
  ${head()}
  <div class="body two">
    <div class="col">
      <h1>Project name<em>.</em></h1>
      <div class="chips"><span class="chip hi">framework@0.0.0</span>
        <span class="chip">language@0.0</span><span class="chip">database</span></div>
      <p class="sum">Two or three sentences on what the system is and who opens it.
        Say what it replaced, and what it has to keep doing every day without
        falling over. Keep it plain.</p>
      <ul>
        <li>What you built, stated as a result rather than a task.</li>
        <li>The decision you made that someone else would have made differently.</li>
        <li>Where the data lives and why it is shaped that way.</li>
        <li>The constraint you worked inside — legacy, uptime, or scale.</li>
      </ul>
      <div class="note"><span class="lbl">Note</span>
        <span>Room for a disclosure line, a credit, or a caveat about what the
        screenshots do and do not show.</span></div>
    </div>
    <div class="slots stack">${slot(1)}${slot(2)}</div>
  </div>
  ${foot(1)}`;

const pageN = (n, from) => `
  ${head()}
  <div class="body">
    <div class="slots grid">${slot(from)}${slot(from + 1)}${slot(from + 2)}${slot(from + 3)}</div>
  </div>
  ${foot(n)}`;

let body = `<div class="sheet">${grid()}<div class="frame"></div>
  ${cross("tl")}${cross("tr")}${cross("bl")}${cross("br")}${page1}</div>`;
for (let n = 2; n <= SHEETS; n++)
  body += `<div class="sheet">${grid()}<div class="frame"></div>
    ${cross("tl")}${cross("tr")}${cross("bl")}${cross("br")}${pageN(n, 2 + (n - 2) * 4 + 1)}</div>`;

const html = `<!doctype html><meta charset="utf-8"><style>
@page { size:A4 landscape; margin:0 }
* { box-sizing:border-box; margin:0 }
body { font-family:Helvetica,Arial,sans-serif; -webkit-print-color-adjust:exact;
       print-color-adjust:exact }
.sheet { width:297mm; height:210mm; background:${INK}; color:${TEXT}; position:relative;
         padding:9mm 11mm; display:flex; flex-direction:column; page-break-after:always }
.sheet:last-child { page-break-after:auto }

/* decoration, all of it vector */
.grid i, .grid u { position:absolute; background:${RULE}; opacity:.55 }
.grid i { top:0; bottom:0; width:.3mm }
.grid u { left:0; right:0; height:.3mm }
.frame { position:absolute; inset:5mm; border:.35mm solid ${RULE} }
.x { position:absolute; width:5mm; height:5mm }
.x s { position:absolute; background:${SIGNAL}; text-decoration:none }
.x s:first-child { left:0; right:0; top:2.35mm; height:.4mm }
.x s.v { top:0; bottom:0; left:2.35mm; width:.4mm }
.x.tl { left:2.5mm; top:2.5mm } .x.tr { right:2.5mm; top:2.5mm }
.x.bl { left:2.5mm; bottom:2.5mm } .x.br { right:2.5mm; bottom:2.5mm }

header { display:flex; align-items:center; gap:4mm; padding-bottom:2.5mm;
         border-bottom:.35mm solid ${RULE}; position:relative }
.mark { font-size:13pt; font-weight:bold; color:${STRONG}; letter-spacing:-.02em }
.mark em { font-style:normal; color:${SIGNAL} }
.lbl { font-size:6.5pt; letter-spacing:.14em; text-transform:uppercase; color:${DIM} }
.lbl.s { color:${STRONG} } .lbl.sig { color:${SIGNAL} } .r { margin-left:auto }

.body { flex:1; padding:5mm 0; min-height:0; position:relative }
.body.two { display:grid; grid-template-columns:88mm 1fr; gap:7mm }
.col { display:flex; flex-direction:column; gap:3.5mm; min-width:0 }
h1 { font-size:23pt; line-height:1.05; color:${STRONG}; font-weight:bold; letter-spacing:-.02em }
h1 em { font-style:normal; color:${SIGNAL} }
.chips { display:flex; gap:1.5mm }
.chip { font-size:6.5pt; border:.3mm solid ${RULE}; padding:.7mm 1.6mm; color:${DIM} }
.chip.hi { border-color:${STRUCT}; color:${STRUCT} }
.sum { font-size:8.5pt; line-height:1.5 }
ul { padding-left:4mm; display:grid; gap:1.6mm; font-size:8pt; line-height:1.4 }
.note { margin-top:auto; border:.3mm solid ${RULE}; padding:2.5mm; display:grid; gap:1mm }
.note span:last-child { font-size:6.5pt; line-height:1.45; color:${DIM} }

.slots { display:grid; gap:4mm; min-height:0 }
.slots.stack { grid-template-rows:1fr 1fr }
.slots.grid { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr }
.slot { display:flex; flex-direction:column; min-height:0; border:.3mm solid ${RULE};
        background:${PANEL}; padding:2mm }
/* one flat fill, nothing layered on it — Canva selects it as a single object */
.green { flex:1; min-height:0; background:${GREEN}; display:flex;
         align-items:center; justify-content:center }
.green span { font-size:9pt; font-weight:bold; letter-spacing:.2em; color:#062B12 }
.cap { display:flex; gap:2mm; padding-top:1.6mm; font-size:6.5pt; letter-spacing:.1em;
       text-transform:uppercase; color:${DIM} }
.cap .n { color:${STRUCT} }

footer { display:flex; gap:6mm; padding-top:2.5mm; border-top:.35mm solid ${RULE};
         position:relative }
footer div { display:grid; gap:.8mm }
footer .v { font-size:7.5pt; color:${STRONG} }
footer .r { margin-left:auto; text-align:right }
</style>${body}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
mkdirSync(dirname(out), { recursive: true });
await page.pdf({ path: out, width: "297mm", height: "210mm", printBackground: true });
await browser.close();
console.log(`${out} — ${SHEETS} sheet, ${2 + (SHEETS - 1) * 4} image slot, grid ${GRID ? "on" : "off"}`);
