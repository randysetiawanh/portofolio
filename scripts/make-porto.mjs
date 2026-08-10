/**
 * Build a per-project portfolio sheet from the screenshots in the CV.
 *
 * The sheet is the site's, folded to A4 landscape: same ink and signal, the
 * drawing frame with registration crosses, the R. monogram, and a title block
 * along the foot the way a real drawing carries one. Copy is pulled from
 * /api/content, so a sheet can never drift from the page it belongs to.
 *
 *   node scripts/make-porto.mjs exec tmp/porto/exec.pdf tmp/porto/shots/*.jpg
 *
 * Everything it writes belongs under tmp/, which is gitignored — this repo is
 * public and the sheets carry ministry screenshots.
 *
 * Writes two files from one source: the .pdf, and a self-contained .html
 * beside it. The HTML carries its images as data URIs, so it is one portable
 * file — every text block is contenteditable, clicking a plate swaps the
 * image, and Cmd-P prints back to the same A4 landscape sheet. The PDF keeps
 * live text rather than outlines, which is what lets Canva import it with the
 * copy still editable.
 *
 * Screenshots must already be redacted — see scripts/redact-shots.py. The
 * ministry's operational figures do not leave the building, and a sheet served
 * from /porto is as public as the page itself.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname } from "node:path";

const [id, out, ...shots] = process.argv.slice(2);
if (!id || !out || !shots.length) {
  console.error("usage: make-porto.mjs <project-id> <out.pdf> <shot.jpg...>");
  process.exit(1);
}

const SITE = process.env.SITE || "https://rancores.space";
const LANG = process.env.LANG_PDF || "en";

const content = await fetch(`${SITE}/api/content`).then((r) => r.json());
const p = (content.projects || []).find((x) => x.id === id);
if (!p) { console.error(`no project "${id}"`); process.exit(1); }

const t = (v) => (v && typeof v === "object" ? v[LANG] || v.en : v) ?? "";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const b64 = (f) => `data:image/jpeg;base64,${readFileSync(f).toString("base64")}`;

const caps = t(p.screens) || [];
const plates = shots.map((f, i) => ({ src: b64(f), cap: caps[i] || basename(f) }));
const year = p.year + (p.ongoing ? " → present" : "");

/* The mark, the frame and the title block repeat on every sheet. */
const MARK = `<svg class="mk" viewBox="0 0 32 32"><path d="M9 26 V6 M9 6 H16.5 Q22 6 22 10.25
  Q22 14.5 16.5 14.5 H9 M13.5 14.5 L22 26" fill="none" stroke="#F4F8FC" stroke-width="4"/>
  <rect x="25" y="20.5" width="5.5" height="5.5" fill="#FF7A18"/></svg>`;

/* `ed` marks a block the HTML edition lets you click into. The PDF render
   ships the same markup without the editor script, so one template serves
   both and the two can never drift apart. */
const sheet = (n, total, body) => `
<div class="sheet">
  <div class="frame"><i></i><i></i><i></i><i></i></div>
  <header>${MARK}<span class="lbl ed">${esc(p.name)}</span>
    <span class="lbl dim ed">${esc(p.runtime.join(" · "))}</span>
    <span class="lbl dim r ed">rancores.space</span></header>
  ${body}
  <footer>
    <div><span class="lbl dim">Drawn by</span><span class="v ed">Randy Setiawan Hoesin</span></div>
    <div><span class="lbl dim">Client</span><span class="v ed">${esc(p.org)}</span></div>
    <div><span class="lbl dim">Role</span><span class="v ed">${esc(t(p.role))}</span></div>
    <div><span class="lbl dim">In service</span><span class="v num ed">${esc(year)}</span></div>
    <div><span class="lbl dim">Sheet</span><span class="v num ed">${n} / ${total}</span></div>
  </footer>
</div>`;

/* `start` keeps plate numbers running across sheets — without it the second
   sheet begins at 01 again and the captions stop matching the register. */
const platesHtml = (list, cls = "", start = 0) =>
  `<div class="plates ${cls}">` + list.map((s, i) => `
    <figure><img src="${s.src}" alt="">
      <figcaption><span class="n num">${String(start + i + 1).padStart(2, "0")}</span>
        <span class="ed">${esc(s.cap)}</span></figcaption></figure>`).join("") + `</div>`;

const page1 = `
  <div class="body two">
    <div class="col">
      <h1 class="ed">${esc(p.name)}<em>.</em></h1>
      <div class="chips">${p.runtime.map((r, i) =>
        `<span class="chip ed${i ? "" : " hi"}">${esc(r)}</span>`).join("")}</div>
      <p class="sum ed">${esc(t(p.sum))}</p>
      <ul class="ed">${(t(p.hi) || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="note"><span class="lbl ed">Figures withheld</span>
        <span class="ed">Operational counts from the ministry's systems are redacted;
        the bars mark deliberate omissions, not missing data.</span></div>
    </div>
    ${platesHtml(plates.slice(0, 2), "stack")}
  </div>`;

const rest = plates.slice(2);
const pages = [sheet(1, rest.length ? 2 : 1, page1)];
if (rest.length) pages.push(sheet(2, 2, `<div class="body">${platesHtml(rest, "grid", 2)}</div>`));

const html = `<!doctype html><meta charset="utf-8"><style>
@page { size: A4 landscape; margin: 0 }
* { box-sizing: border-box; margin: 0 }
:root { --ink:#080C11; --panel:#0E141B; --rule:#1F2C39; --dim:#6E8194;
        --text:#DCE5ED; --strong:#F4F8FC; --signal:#FF7A18; --structure:#3A7BFD }
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
       -webkit-print-color-adjust: exact; print-color-adjust: exact }
.sheet { width:297mm; height:210mm; background:var(--ink); color:var(--text);
         padding:9mm 11mm; position:relative; page-break-after:always;
         display:flex; flex-direction:column;
         background-image:linear-gradient(var(--rule) 1px,transparent 1px),
                          linear-gradient(90deg,var(--rule) 1px,transparent 1px);
         background-size:14mm 14mm; background-position:-1px -1px }
.sheet:last-child { page-break-after:auto }
.frame { position:absolute; inset:5mm; border:.4pt solid var(--rule); pointer-events:none }
.frame i { position:absolute; width:5mm; height:5mm }
.frame i::before,.frame i::after { content:""; position:absolute; background:var(--signal) }
.frame i::before { left:0; right:0; top:50%; height:.6pt }
.frame i::after { top:0; bottom:0; left:50%; width:.6pt }
.frame i:nth-child(1){left:-2.5mm;top:-2.5mm} .frame i:nth-child(2){right:-2.5mm;top:-2.5mm}
.frame i:nth-child(3){left:-2.5mm;bottom:-2.5mm} .frame i:nth-child(4){right:-2.5mm;bottom:-2.5mm}
header { display:flex; align-items:center; gap:4mm; padding-bottom:2.5mm;
         border-bottom:.4pt solid var(--rule) }
.mk { width:5.5mm; height:5.5mm; flex:none }
.lbl { font-size:6.5pt; letter-spacing:.14em; text-transform:uppercase; color:var(--strong) }
.lbl.dim { color:var(--dim) } .lbl.r { margin-left:auto; color:var(--signal) }
.body { flex:1; padding:5mm 0; min-height:0 }
.body.two { display:grid; grid-template-columns:88mm 1fr; gap:7mm }
.col { display:flex; flex-direction:column; gap:3.5mm; min-width:0 }
h1 { font-size:23pt; line-height:1.02; letter-spacing:-.02em; color:var(--strong); font-weight:800 }
h1 em { font-style:normal; color:var(--signal) }
.chips { display:flex; flex-wrap:wrap; gap:1.5mm }
.chip { font-size:6.5pt; letter-spacing:.05em; border:.4pt solid var(--rule);
        padding:.7mm 1.6mm; color:var(--dim) }
.chip.hi { border-color:var(--structure); color:var(--structure) }
.sum { font-size:8.5pt; line-height:1.5 }
ul { margin:0; padding-left:4mm; display:grid; gap:1.6mm; font-size:8pt; line-height:1.4 }
li::marker { color:var(--signal) }
.note { margin-top:auto; border:.4pt dashed var(--rule); padding:2.5mm; display:grid; gap:1mm }
.note span:last-child { font-size:6.5pt; line-height:1.45; color:var(--dim) }
.plates { display:grid; gap:4mm; min-height:0 }
.plates.stack { grid-template-rows:1fr 1fr }
.plates.grid { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr }
figure { display:flex; flex-direction:column; min-height:0; border:.4pt solid var(--rule);
         background:var(--panel); padding:2mm }
figure img { flex:1; min-height:0; width:100%; object-fit:contain; object-position:center }
figcaption { display:flex; gap:2mm; align-items:baseline; padding-top:1.6mm; font-size:6.5pt;
             letter-spacing:.1em; text-transform:uppercase; color:var(--dim) }
figcaption .n { color:var(--structure) }
footer { display:flex; gap:6mm; padding-top:2.5mm; border-top:.4pt solid var(--rule) }
footer div { display:grid; gap:.8mm }
footer .v { font-size:7.5pt; color:var(--strong) }
footer div:last-child { margin-left:auto; text-align:right }
.num { font-variant-numeric:tabular-nums }
</style>${pages.join("")}`;

/* ── the editable edition ───────────────────────────────────────────────
   Same document, plus the means to change it: every `ed` block becomes
   contenteditable, a plate swaps its image from a file picker, and print
   drops the editing chrome so Cmd-P lands on the identical sheet.        */
const EDITOR = `
<div id="bar">
  <b>R</b>
  <span id="hint">Click selects · drag moves · double-click edits text or swaps a
    plate · corner handle resizes · Delete removes</span>
  <button data-add="text">+ Text</button>
  <button data-add="plate">+ Plate</button>
  <button data-add="badge">+ Badge</button>
  <button id="addsheet">+ Sheet</button>
  <button id="undo" title="Ctrl-Z">Undo</button>
  <button id="savehtml">Save HTML</button>
  <button id="save" class="go">Save as PDF</button>
</div>
<div id="menu"></div>
<style>
  body { background:#05080B; padding:26px 0 }
  .sheet { margin:0 auto 26px; box-shadow:0 24px 60px -30px #000 }
  #bar { position:sticky; top:0; z-index:20; display:flex; align-items:center; gap:8px;
         margin:0 auto 22px; width:297mm; padding:10px 12px; background:#0E141B;
         border:1px solid #1F2C39; color:#6E8194;
         font:500 11px/1.5 ui-monospace,Menlo,monospace; letter-spacing:.06em }
  #bar b { color:#F4F8FC; font-size:15px; flex:none }
  #bar b::after { content:"."; color:#FF7A18 }
  #hint { flex:1; min-width:0 }
  #bar button { flex:none; cursor:pointer; background:transparent; color:#6E8194;
                border:1px solid #1F2C39; padding:7px 10px;
                font:500 10px/1 ui-monospace,Menlo,monospace; letter-spacing:.12em;
                text-transform:uppercase }
  #bar button:hover { border-color:#FF7A18; color:#FF7A18 }
  #bar button.go { background:#FF7A18; border-color:#FF7A18; color:#0B0E12 }
  #menu { position:fixed; z-index:30; display:none; background:#0E141B;
          border:1px solid #1F2C39; padding:4px; min-width:180px }
  #menu button { display:block; width:100%; text-align:left; background:none; border:0;
                 color:#DCE5ED; cursor:pointer; padding:8px 10px;
                 font:500 10px/1 ui-monospace,Menlo,monospace; letter-spacing:.1em }
  #menu button:hover { background:#1F2C39; color:#FF7A18 }

  /* selection, dragging, resizing */
  .obj { cursor:move }
  .obj:hover { outline:1px dashed #3A7BFD; outline-offset:2px }
  .obj.sel { outline:1px solid #FF7A18; outline-offset:2px }
  .obj.editing { cursor:text; outline:1px solid #FF7A18 }
  .grip { position:absolute; right:-5px; bottom:-5px; width:10px; height:10px;
          background:#FF7A18; cursor:nwse-resize; z-index:5; display:none }
  .obj.sel > .grip { display:block }

  .ctrl { position:absolute; top:2mm; right:2mm; display:none; gap:3px; z-index:6 }
  figure:hover .ctrl, figure.sel .ctrl { display:flex }
  .ctrl button { width:20px; height:20px; cursor:pointer; background:#0E141B;
                 border:1px solid #1F2C39; color:#6E8194; font:500 11px/1 ui-monospace,monospace }
  .ctrl button:hover { border-color:#FF7A18; color:#FF7A18 }

  figure.empty { border-style:dashed }
  figure.empty img { visibility:hidden }
  figure.empty::before { content:"DOUBLE-CLICK TO ADD IMAGE"; position:absolute; inset:2mm;
                         display:grid; place-content:center; color:#6E8194; pointer-events:none;
                         font:500 9px/1 ui-monospace,Menlo,monospace; letter-spacing:.16em }

  .chip { position:relative }
  .rmchip { position:absolute; top:-7px; right:-7px; display:none; width:14px; height:14px;
            border-radius:50%; background:#FF7A18; color:#0B0E12; cursor:pointer;
            font:700 10px/14px ui-monospace,Menlo,monospace; text-align:center; user-select:none }
  .chip:hover .rmchip { display:block }
  .addchip { cursor:pointer; background:none; border:1px dashed #3A7BFD; color:#3A7BFD;
             font:500 10px/1 ui-monospace,Menlo,monospace; padding:0 6px; align-self:stretch }
  .addchip:hover { border-color:#FF7A18; color:#FF7A18 }

  /* a text block added by hand, styled like the body copy it sits among */
  .txt { font-size:8.5pt; line-height:1.5; color:#DCE5ED; min-width:20mm }

  @media print {
    body { background:none; padding:0 }
    #bar, #menu, .ctrl, .rmchip, .addchip, .grip { display:none !important }
    .sheet { margin:0; box-shadow:none }
    figure.empty { display:none }            /* never print an unfilled slot */
    .obj, .obj.sel, .obj:hover { outline:none !important }
  }
</style>
<script>
(function(){
"use strict";
var BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
var bar = document.getElementById("bar"), menu = document.getElementById("menu");
document.body.prepend(bar);

/* ── what counts as a movable object ──────────────────────────────────
   Coarse on purpose: a heading, the badge row, a paragraph, the list, the
   note, each plate, and the two rules. Finer than this and the sheet stops
   being a drawing and turns into confetti.                              */
var OBJ = "h1, .chips, .sum, ul, .note, figure, header, footer, .txt";
var sel = null, hist = [], dragging = false, zTop = 10;

/* Whatever you touch comes to the front. Without this a block dragged over a
   neighbour slides under it and cannot be picked up again. */
function raise(el){ el.style.zIndex = ++zTop; }

/* Only the sheets are snapshotted, never the whole body: the toolbar lives in
   the body too, and cloning it meant undo restored a second copy of itself. */
function snap(){
  var frag = document.createElement("div");
  document.querySelectorAll(".sheet").forEach(function(s){ frag.appendChild(s.cloneNode(true)); });
  hist.push(frag);
  if(hist.length > 8) hist.shift();
}

/* ── freeing a sheet ──────────────────────────────────────────────────
   Everything is measured first and only then repositioned: move one box at
   a time and the grid reflows under the tape measure, so the second object
   lands where the first used to be. The whole sheet converts at once, the
   first time anything on it is dragged.                                  */
function free(sheet){
  if(sheet.dataset.free) return;
  sheet.dataset.free = "1";
  var els = [].slice.call(sheet.querySelectorAll(OBJ));
  var s = sheet.getBoundingClientRect();
  var box = els.map(function(el){
    var r = el.getBoundingClientRect();
    return { el: el, l: r.left - s.left, t: r.top - s.top, w: r.width, h: r.height };
  });
  box.forEach(function(b){
    b.el.style.position = "absolute";
    b.el.style.left = b.l + "px";
    b.el.style.top = b.t + "px";
    b.el.style.width = b.w + "px";
    if(b.el.matches("figure, .note")) b.el.style.height = b.h + "px";
    b.el.style.margin = "0";
    sheet.appendChild(b.el);
  });
}

function select(el){
  if(sel === el) return;
  deselect();
  sel = el;
  if(!el) return;
  el.classList.add("sel");
  raise(el);
  if(!el.querySelector(":scope > .grip")){
    var g = document.createElement("div");
    g.className = "grip";
    g.addEventListener("mousedown", startResize);
    el.appendChild(g);
  }
}
function deselect(){
  if(!sel) return;
  sel.classList.remove("sel");
  sel = null;
}

/* ── drag ─────────────────────────────────────────────────────────── */
function startDrag(e){
  var el = e.target.closest(OBJ);
  if(!el || e.target.closest(".ctrl, .grip, .rmchip, .addchip")) return;
  if(el.classList.contains("editing")) return;          // typing, not moving
  var sheet = el.closest(".sheet");
  if(!sheet) return;
  select(el);
  free(sheet);
  var sx = e.clientX, sy = e.clientY;
  var l0 = parseFloat(el.style.left) || 0, t0 = parseFloat(el.style.top) || 0;
  var moved = false;
  function move(ev){
    if(!moved){ if(Math.abs(ev.clientX-sx) + Math.abs(ev.clientY-sy) < 3) return; snap(); moved = dragging = true; }
    el.style.left = (l0 + ev.clientX - sx) + "px";
    el.style.top  = (t0 + ev.clientY - sy) + "px";
  }
  function up(){
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
    setTimeout(function(){ dragging = false; }, 0);
  }
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
  e.preventDefault();
}

function startResize(e){
  var el = e.target.parentElement;
  free(el.closest(".sheet"));
  snap();
  var sx = e.clientX, sy = e.clientY;
  var w0 = el.offsetWidth, h0 = el.offsetHeight;
  function move(ev){
    el.style.width = Math.max(30, w0 + ev.clientX - sx) + "px";
    if(el.matches("figure, .note, .txt")) el.style.height = Math.max(24, h0 + ev.clientY - sy) + "px";
  }
  function up(){
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
  }
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
  e.stopPropagation(); e.preventDefault();
}

/* ── text editing: a second click, so the first can select and drag ─── */
function edit(el){
  el.contentEditable = "true";
  el.classList.add("editing");
  el.focus();
  el.addEventListener("blur", function off(){
    el.removeAttribute("contenteditable");
    el.classList.remove("editing");
    el.removeEventListener("blur", off);
  });
}

function pick(img){
  var f = document.createElement("input");
  f.type = "file"; f.accept = "image/*";
  f.onchange = function(){
    var file = f.files[0]; if(!file) return;
    var r = new FileReader();
    r.onload = function(){ snap(); img.src = r.result; img.closest("figure").classList.remove("empty"); };
    r.readAsDataURL(file);
  };
  f.click();
}

/* ── numbering is derived, never typed ─────────────────────────────── */
function renumber(){
  document.querySelectorAll("figure").forEach(function(fig, i){
    var n = fig.querySelector("figcaption .n");
    if(n) n.textContent = String(i + 1).padStart(2, "0");
  });
  var sheets = document.querySelectorAll(".sheet");
  sheets.forEach(function(s, i){
    var f = s.querySelector("footer div:last-child .v");
    if(f) f.textContent = (i + 1) + " / " + sheets.length;
  });
}

function blankPlate(){
  var fig = document.createElement("figure");
  fig.className = "empty";
  fig.innerHTML = '<img src="' + BLANK + '" alt="">' +
    '<figcaption><span class="n num">00<\\/span><span class="ed">New screen<\\/span><\\/figcaption>';
  return fig;
}

function wireChip(c){
  if(c.querySelector(".rmchip")) return;
  var rm = document.createElement("b");
  rm.className = "rmchip";
  rm.contentEditable = "false";
  rm.title = "Remove this badge";
  rm.textContent = "\\u00d7";
  rm.onmousedown = function(e){ e.preventDefault(); e.stopPropagation(); snap(); c.remove(); };
  c.appendChild(rm);
}

/* ── wiring, re-runnable after undo or after a sheet is added ───────── */
function wireAll(){
  document.querySelectorAll(OBJ).forEach(function(el){ el.classList.add("obj"); });

  document.querySelectorAll("figure").forEach(function(fig){
    if(!fig.querySelector(":scope > .ctrl")){
      var c = document.createElement("div");
      c.className = "ctrl";
      c.innerHTML = "<button title='Add a plate after this one'>+<\\/button>" +
                    "<button title='Remove this plate'>\\u00d7<\\/button>";
      c.children[0].onclick = function(e){
        e.stopPropagation(); snap();
        var n = blankPlate();
        fig.after(n);
        if(fig.style.left){                       // freed sheet: offset the copy
          n.style.position = "absolute";
          n.style.left = (parseFloat(fig.style.left) + 8) + "px";
          n.style.top = (parseFloat(fig.style.top) + 8) + "px";
          n.style.width = fig.style.width; n.style.height = fig.style.height;
          raise(n);
        }
        wireAll(); renumber();
      };
      c.children[1].onclick = function(e){
        e.stopPropagation();
        if(document.querySelectorAll("figure").length > 1){ snap(); fig.remove(); renumber(); }
      };
      fig.appendChild(c);
    }
  });

  document.querySelectorAll(".chips").forEach(function(row){
    row.querySelectorAll(".chip").forEach(wireChip);
    if(!row.querySelector(".addchip")){
      var add = document.createElement("button");
      add.className = "addchip"; add.textContent = "+"; add.title = "Add a stack badge";
      add.onmousedown = function(e){ e.stopPropagation(); };
      add.onclick = function(e){
        e.stopPropagation(); snap();
        var c = document.createElement("span");
        c.className = "chip ed"; c.textContent = "name@0.0.0";
        row.insertBefore(c, add); wireChip(c);
        edit(c); document.execCommand("selectAll", false, null);
      };
      row.appendChild(add);
    }
  });
}

/* ── page-level interaction ─────────────────────────────────────────── */
document.addEventListener("mousedown", function(e){
  if(e.target.closest("#bar, #menu")) return;
  if(!e.target.closest(OBJ)){ deselect(); return; }
  startDrag(e);
});
document.addEventListener("dblclick", function(e){
  var img = e.target.closest("figure img");
  if(img){ pick(img); return; }
  var el = e.target.closest(".ed, .txt, h1, .sum, li, .v, .lbl");
  if(el && el.closest(".sheet")) edit(el.matches("li") ? el.closest("ul") : el);
});
document.addEventListener("keydown", function(e){
  if(e.key === "Escape") deselect();
  if((e.key === "Delete" || e.key === "Backspace") && sel && !sel.classList.contains("editing")){
    e.preventDefault(); snap(); sel.remove(); sel = null; renumber();
  }
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z"){ e.preventDefault(); undo(); }
});

function undo(){
  var prev = hist.pop();
  if(!prev) return;
  document.querySelectorAll(".sheet").forEach(function(s){ s.remove(); });
  while(prev.firstChild) document.body.appendChild(prev.firstChild);
  sel = null;
  wireAll(); renumber();
}
document.getElementById("undo").onclick = undo;

/* ── adding ─────────────────────────────────────────────────────────── */
function centreOf(sheet, el, w, h){
  free(sheet);
  el.style.position = "absolute";
  el.style.width = w + "px";
  el.style.left = ((sheet.clientWidth - w) / 2) + "px";
  el.style.top = ((sheet.clientHeight - h) / 2) + "px";
  sheet.appendChild(el);
  raise(el);                       // a new block lands on top, not underneath
  select(el);
}
bar.querySelectorAll("[data-add]").forEach(function(btn){
  btn.onclick = function(){
    var sheet = (sel && sel.closest(".sheet")) || document.querySelector(".sheet");
    var kind = btn.dataset.add;
    snap();
    if(kind === "text"){
      var t = document.createElement("div");
      t.className = "txt ed";
      t.textContent = "New text block. Double-click to edit.";
      centreOf(sheet, t, 220, 40);
    } else if(kind === "plate"){
      var f = blankPlate();
      centreOf(sheet, f, 340, 220);
      f.style.height = "220px";
    } else {
      var row = sheet.querySelector(".chips");
      if(row) row.querySelector(".addchip").click();
      return;
    }
    wireAll(); renumber();
  };
});

/* ── a new sheet, copied from whichever one you point at ────────────── */
document.getElementById("addsheet").onclick = function(e){
  var r = e.target.getBoundingClientRect();
  menu.innerHTML = "";
  document.querySelectorAll(".sheet").forEach(function(s, i){
    var b = document.createElement("button");
    b.textContent = "Copy layout of sheet " + (i + 1);
    b.onclick = function(){ addSheet(s); };
    menu.appendChild(b);
  });
  var blank = document.createElement("button");
  blank.textContent = "Blank sheet";
  blank.onclick = function(){ addSheet(null); };
  menu.appendChild(blank);
  menu.style.left = Math.min(r.left, innerWidth - 200) + "px";
  menu.style.top = (r.bottom + 6) + "px";
  menu.style.display = "block";
};
document.addEventListener("click", function(e){
  if(!e.target.closest("#menu, #addsheet")) menu.style.display = "none";
});

function addSheet(src){
  snap();
  menu.style.display = "none";
  var sheets = document.querySelectorAll(".sheet");
  var s;
  if(src){
    s = src.cloneNode(true);
    // the layout is what is being copied, not the pictures
    s.querySelectorAll("figure").forEach(function(f){
      f.classList.add("empty");
      f.querySelector("img").src = BLANK;
    });
  } else {
    s = sheets[sheets.length - 1].cloneNode(true);
    var body = s.querySelector(".body");
    if(body){ body.className = "body"; body.innerHTML = ""; }
    s.querySelectorAll("figure, h1, .chips, .sum, ul, .note, .txt").forEach(function(x){ x.remove(); });
    delete s.dataset.free;
  }
  s.querySelectorAll(".ctrl, .grip, .addchip, .rmchip").forEach(function(x){ x.remove(); });
  s.querySelectorAll(".sel").forEach(function(x){ x.classList.remove("sel"); });
  document.body.appendChild(s);
  wireAll(); renumber();
  s.scrollIntoView({behavior:"smooth", block:"start"});
}

/* ── saving ─────────────────────────────────────────────────────────── */
document.getElementById("save").onclick = function(){ deselect(); print(); };
document.getElementById("savehtml").onclick = function(){
  deselect();
  var c = document.documentElement.cloneNode(true);
  c.querySelectorAll("[contenteditable]").forEach(function(el){ el.removeAttribute("contenteditable"); });
  c.querySelectorAll(".ctrl, .rmchip, .addchip, .grip").forEach(function(el){ el.remove(); });
  c.querySelectorAll(".obj").forEach(function(el){ el.classList.remove("obj", "sel", "editing"); });
  var name = (document.querySelector("h1") || {}).textContent || "sheet";
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["<!doctype html>\\n" + c.outerHTML], {type:"text/html"}));
  a.download = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".html";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
};

wireAll();
renumber();
})();
<\/script>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
mkdirSync(dirname(out), { recursive: true });
await page.pdf({ path: out, width: "297mm", height: "210mm", printBackground: true });

const htmlOut = out.replace(/\.pdf$/, "") + ".html";
writeFileSync(htmlOut, html + EDITOR);
const written = [out, htmlOut];

/* ── the Canva editions ─────────────────────────────────────────────────
   What Canva mangles on import is not the pictures, it is the vector CSS:
   the 14mm grid, the frame and its registration crosses, hairline rules and
   dashed borders arrive as hundreds of paths and come back rotated, dropped
   or fused. So the decoration stops being vector. Each sheet is rendered to
   one high-resolution raster and everything else is layered on top of it:

     -canva-flat.pdf   one image per page, nothing else. Nothing to
                       misread, so nothing can go missing — but nothing is
                       editable in Canva either.
     -canva-text.pdf   the same raster with the decoration removed and the
                       copy left as real text, so Canva imports editable
                       text boxes over an exact background.

   Both carry the sheets as PNG at DPI x3, which is 288 dpi at A4.         */
const DPI = Number(process.env.CANVA_SCALE || 3);
const W = 1122.52, H = 793.7;                        // 297x210mm at 96dpi
if (!process.env.CANVA) {
  await browser.close();
  console.log(written.join("\n") + `\n  ${pages.length} sheet, ${plates.length} plate`);
  process.exit(0);
}

/* the copy has to be invisible in the background plate, or Canva paints the
   live text on top of a picture of the same text and the two ghost */
const HIDE_TEXT = `h1,.sum,ul,.chip,.lbl,.v,figcaption span:last-child,.note span
  { color:transparent !important }`;

/* Everything already baked into the plate is switched off, but only in ways
   that keep the box model identical, so the text lands where it always was.
   The plate rides as an <img>, not as a background: a multi-megabyte data URI
   silently exceeds Chromium's limit on a CSS property value, and the second
   sheet came back bare because of it. An element source has no such ceiling. */
const OVER = `
  .sheet { background-image:none !important }
  .sheet > .plate { position:absolute; inset:0; width:100%; height:100%; z-index:0 }
  .sheet > header, .sheet > .body, .sheet > footer { position:relative; z-index:1 }
  .sheet .frame, .sheet svg.mk, .sheet figure img { visibility:hidden }
  .sheet figure { border-color:transparent !important; background:none !important }
  .sheet .chip, .sheet .note, .sheet header, .sheet footer
    { border-color:transparent !important }
  .sheet li::marker { color:transparent }`;

const shot = async (styles) => {
  const p2 = await browser.newPage({ viewport: { width: Math.ceil(W), height: Math.ceil(H) },
                                     deviceScaleFactor: DPI });
  await p2.setContent(html, { waitUntil: "load" });
  if (styles) await p2.addStyleTag({ content: styles });
  const buf = [];
  for (const el of await p2.locator(".sheet").all()) buf.push(await el.screenshot({ type: "png" }));
  await p2.close();
  return buf;
};

const full = await shot(null);          // for the flat edition
const bare = await shot(HIDE_TEXT);     // background for the text edition
const uri = (b) => `data:image/png;base64,${b.toString("base64")}`;

const flatHtml = `<!doctype html><meta charset="utf-8"><style>
@page{size:A4 landscape;margin:0}*{margin:0}
.p{width:297mm;height:210mm;page-break-after:always;display:block}
.p:last-child{page-break-after:auto}img{display:block;width:100%;height:100%}
</style>` + full.map((b) => `<div class="p"><img src="${uri(b)}"></div>`).join("");

const pf = await browser.newPage();
await pf.setContent(flatHtml, { waitUntil: "load" });
const flatOut = out.replace(/\.pdf$/, "") + "-canva-flat.pdf";
await pf.pdf({ path: flatOut, width: "297mm", height: "210mm", printBackground: true });
await pf.close();
written.push(flatOut);

let k = 0;
const plated = html.replace(/<div class="sheet">/g,
  (m) => m + `<img class="plate" src="${uri(bare[k++])}">`) + `<style>${OVER}</style>`;
const pt = await browser.newPage();
await pt.setContent(plated, { waitUntil: "load" });
await pt.waitForFunction(() => [...document.querySelectorAll("img.plate")].every((i) => i.complete));
const textOut = out.replace(/\.pdf$/, "") + "-canva-text.pdf";
await pt.pdf({ path: textOut, width: "297mm", height: "210mm", printBackground: true });
await pt.close();
written.push(textOut);

await browser.close();
console.log(written.join("\n") + `\n  ${pages.length} sheet, ${plates.length} plate, plate DPI x${DPI}`);
