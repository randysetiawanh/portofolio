/**
 * Admin UI, bundled into the Worker rather than shipped as a static asset —
 * a file in public/ would be reachable directly, bypassing the Access gate.
 *
 * Every string on the public page is reachable from here. Prose lives in the
 * bilingual `i18n` document and is rendered from FIELDS below, so adding a new
 * editable string is one line of schema rather than a new form.
 */
export const ADMIN_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Portfolio — content</title>
<style>
:root{
  --ink:#080C11;--panel:#0E141B;--panel2:#131C26;--rule:#1F2C39;
  --dim:#6E8194;--text:#DCE5ED;--strong:#F4F8FC;--blue:#3A7BFD;--sig:#FF7A18;
  --ok:#3DC98D;--bad:#FF5C5C;
}
@media (prefers-color-scheme:light){
  :root{--ink:#EBEEF1;--panel:#F6F8FA;--panel2:#fff;--rule:#C3CEDA;
        --dim:#5A6B7C;--text:#111A22;--strong:#04090D;--blue:#1F5AD6;--sig:#C0530B;
        --ok:#1E8A5E;--bad:#C62828;}
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font:15px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}
.lbl{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
header{position:sticky;top:0;z-index:20;display:flex;gap:.8rem;align-items:center;
  padding:.7rem 1rem;border-bottom:1px solid var(--rule);flex-wrap:wrap;
  background:color-mix(in srgb,var(--ink) 94%,transparent);backdrop-filter:blur(10px)}
header b{font-size:13px;letter-spacing:.18em;font-family:ui-monospace,monospace;color:var(--strong)}
nav{display:flex;gap:.2rem;margin-left:auto;flex-wrap:wrap}
nav button{background:none;border:1px solid transparent;color:var(--dim);cursor:pointer;
  padding:.3rem .6rem;font:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
nav button.on,nav button:hover{color:var(--strong);border-color:var(--rule)}
main{padding:1.25rem;max-width:1080px;margin:0 auto}
section{display:none}section.on{display:block}
h2{font-size:1.15rem;margin:0 0 .2rem}
.hint{color:var(--dim);font-size:13px;margin:0 0 1.2rem;max-width:64ch}
h3{font-size:.8rem;font-family:ui-monospace,monospace;letter-spacing:.14em;
  text-transform:uppercase;color:var(--dim);margin:1.6rem 0 .7rem;
  border-bottom:1px solid var(--rule);padding-bottom:.4rem}
.card{border:1px solid var(--rule);background:var(--panel);margin-bottom:.55rem}
.card>summary{cursor:pointer;padding:.65rem .85rem;display:flex;gap:.7rem;align-items:center;list-style:none}
.card>summary::-webkit-details-marker{display:none}
.card>summary::before{content:"▸";color:var(--dim);transition:transform .15s}
.card[open]>summary::before{transform:rotate(90deg)}
.card>summary strong{font-size:.95rem;color:var(--strong)}
.card>summary .tag{margin-left:auto;font-family:ui-monospace,monospace;font-size:11px;color:var(--dim)}
.body{padding:.2rem .85rem 1rem;display:grid;gap:.75rem}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
@media(max-width:760px){.g2{grid-template-columns:1fr}}
label{display:grid;gap:.28rem}
input[type=text],input[type=month],input[type=number],textarea,select{
  background:var(--panel2);border:1px solid var(--rule);color:var(--text);
  padding:.48rem .58rem;font:inherit;font-size:14px;width:100%}
textarea{min-height:70px;resize:vertical}
input:focus,textarea:focus,select:focus{outline:none;border-color:var(--blue)}
.row{display:flex;gap:.55rem;align-items:center;flex-wrap:wrap}
.chk{display:flex;gap:.4rem;align-items:center}
button.act{background:var(--blue);color:#fff;border:0;padding:.5rem .95rem;cursor:pointer;
  font:inherit;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
button.act.warn{background:transparent;color:var(--bad);border:1px solid var(--bad)}
button.act.ghost{background:transparent;color:var(--dim);border:1px solid var(--rule)}
button.act.tiny{padding:.3rem .5rem;font-size:10px}
button.act:disabled{opacity:.5;cursor:not-allowed}
.bar{position:sticky;bottom:0;z-index:5;display:flex;gap:.55rem;align-items:center;flex-wrap:wrap;
  padding:.85rem 0;background:linear-gradient(transparent,var(--ink) 40%)}
.msg{font-family:ui-monospace,monospace;font-size:12px}
.msg.ok{color:var(--ok)}.msg.bad{color:var(--bad)}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:.45rem .55rem;border-bottom:1px solid var(--rule);vertical-align:middle}
th{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
td.k{font-family:ui-monospace,monospace;color:var(--strong);word-break:break-all}
td img{width:32px;height:32px;object-fit:contain;background:var(--panel2);border:1px solid var(--rule)}
.drop{border:1px dashed var(--rule);padding:1.3rem;text-align:center;color:var(--dim);margin-bottom:1rem}
.drop.hot{border-color:var(--sig);color:var(--sig)}
.err{color:var(--bad);font-family:ui-monospace,monospace;font-size:12px}
/* background swatches — declarations come from src/patterns.ts, so what you
   see here is literally what the page will render */
/*__SWATCH_CSS__*/
.bgwrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.7rem}
.bgopt{border:1px solid var(--rule);background:var(--panel);cursor:pointer;padding:0;
  text-align:left;display:grid;font:inherit;color:inherit}
.bgopt:hover{border-color:var(--sig)}
.bgopt[aria-pressed="true"]{border-color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}
.bgopt .prev{height:96px;background-color:var(--ink);position:relative}
.bgopt[aria-pressed="true"] .prev::after{content:"IN USE";position:absolute;right:.4rem;top:.4rem;
  font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.14em;color:var(--blue)}
.bgopt .cap{padding:.55rem .65rem;display:grid;gap:.25rem;border-top:1px solid var(--rule)}
.bgopt .cap b{font-size:.8125rem;color:var(--strong);font-weight:600}
.bgopt .cap span{font-size:.75rem;color:var(--dim);line-height:1.4}

/* media picker */
.pick{display:flex;gap:.4rem;align-items:stretch}
.pick input{flex:1}
.thumb{width:34px;height:34px;flex:none;border:1px solid var(--rule);background:var(--panel2);
  object-fit:contain;display:block}
#modal{position:fixed;inset:0;z-index:50;background:rgba(2,5,9,.72);display:none;
  align-items:center;justify-content:center;padding:1rem}
#modal.on{display:flex}
#modal .box{background:var(--panel);border:1px solid var(--blue);max-width:760px;width:100%;
  max-height:82vh;overflow:auto}
#modal .box header{position:sticky;top:0}
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.55rem;padding:1rem}
.mitem{border:1px solid var(--rule);background:var(--panel2);padding:.5rem;cursor:pointer;
  display:grid;gap:.4rem;justify-items:center;text-align:center}
.mitem:hover{border-color:var(--sig)}
.mitem img{width:100%;height:62px;object-fit:contain}
.mitem .n{font-family:ui-monospace,monospace;font-size:10px;color:var(--dim);word-break:break-all}
.mitem .pdf{height:62px;display:grid;place-items:center;color:var(--sig);
  font-family:ui-monospace,monospace;font-size:12px}
</style>
</head>
<body>
<header>
  <b>PORTFOLIO / CONTENT</b>
  <span class="lbl" id="who"></span>
  <nav id="tabs"></nav>
</header>
<main id="main"></main>

<div id="modal"><div class="box">
  <header><b>PICK A FILE</b>
    <button class="act ghost" id="mUpload" style="margin-left:auto">Upload new</button>
    <button class="act ghost" id="mClose">Close</button>
  </header>
  <div class="mgrid" id="mgrid"></div>
</div></div>
<input type="file" id="hiddenFile" hidden multiple>
<script>/*__PATTERN_DATA__*/</script>

<script>
const $ = s => document.querySelector(s);
const el = (t, a = {}, kids = []) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const c of [].concat(kids)) if (c) n.append(c);
  return n;
};
const lines = v => (Array.isArray(v) ? v.join("\n") : "");
const toLines = v => v.split("\n").map(s => s.trim()).filter(Boolean);

let STATE = { content: {}, media: [] };
let pickTarget = null, pickFolder = "img";

/* ── primitives ───────────────────────────────────────────────────────── */
function field(label, value, oninput, type = "text") {
  const inp = type === "textarea" ? el("textarea") : el("input", { type });
  inp.value = value ?? "";
  inp.addEventListener("input", () => oninput(inp.value));
  return el("label", {}, [el("span", { class: "lbl", text: label }), inp]);
}
function check(label, value, onchange) {
  const inp = el("input", { type: "checkbox" });
  inp.checked = !!value;
  inp.addEventListener("change", () => onchange(inp.checked));
  return el("div", { class: "chk" }, [inp, el("span", { class: "lbl", text: label })]);
}
function select(label, value, opts, onchange) {
  const s = el("select");
  for (const o of opts) s.append(el("option", { value: o, text: o }));
  s.value = value ?? opts[0];
  s.addEventListener("change", () => onchange(s.value));
  return el("label", {}, [el("span", { class: "lbl", text: label }), s]);
}

/** Text input backed by the media library: pick an existing file or upload one. */
function mediaField(label, value, onchange, folder) {
  const inp = el("input", { type: "text" });
  inp.value = value ?? "";
  const thumb = el("img", { class: "thumb", alt: "" });
  const paint = v => { thumb.style.visibility = v ? "visible" : "hidden"; if (v) thumb.src = v; };
  paint(inp.value);
  inp.addEventListener("input", () => { onchange(inp.value); paint(inp.value); });

  const btn = el("button", { class: "act ghost", type: "button", text: "Browse" });
  btn.addEventListener("click", () => openPicker(folder, v => {
    inp.value = v; onchange(v); paint(v);
  }));
  return el("label", {}, [
    el("span", { class: "lbl", text: label }),
    el("div", { class: "pick" }, [thumb, inp, btn]),
  ]);
}

/* ── i18n schema — every editable string on the page ──────────────────── */
const FIELDS = {
  hero: [
    ["Opening statement", "hero.thesis", 1],

  ],
  map: [
    ["Diagram caption", "map.title"], ["Diagram hint", "map.hint"],
    ["Legend — in production", "map.live"], ["Legend — archived", "map.archived"],
    ["Legend — disclosure note", "map.note"],
  ],
  profile: [
    ["Section heading", "h.profile"],
    ["Paragraph 1", "p.b1", 1], ["Paragraph 2", "p.b2", 1],
    ["Portrait placeholder", "p.slot"],
    ["Label — base", "k.base"],
    ["Label — discipline", "k.disc"], ["Value — discipline", "v.disc"],
    ["Label — education", "k.edu"], ["Value — education", "v.edu"],
    ["Label — GPA", "k.gpa"],
    ["Label — languages", "k.lang"], ["Value — languages", "v.lang"],
    ["Label — practice", "k.method"], ["Value — practice", "v.method"],
  ],
  path: [
    ["Section heading", "h.path"], ["Section subtitle", "h.pathsub"],
    ["Group — employment", "g.emp"], ["Group — programmes", "g.prog"], ["Group — education", "g.edu"],
    ["Word for “present”", "t.present"],
    ["Role card 1 — title", "r1.t"], ["Role card 1 — org line", "r1.org"],
    ["Role card 1 — bullet 1", "r1.a", 1], ["Role card 1 — bullet 2", "r1.b", 1], ["Role card 1 — bullet 3", "r1.c", 1],
    ["Role card 2 — title", "r2.t"], ["Role card 2 — org line", "r2.org"],
    ["Role card 2 — bullet 1", "r2.a", 1], ["Role card 2 — bullet 2", "r2.b", 1], ["Role card 2 — bullet 3", "r2.c", 1],
    ["Role card 3 — title", "r3.t"], ["Role card 3 — org line", "r3.org"],
    ["Role card 3 — bullet 1", "r3.a", 1], ["Role card 3 — bullet 2", "r3.b", 1], ["Role card 3 — bullet 3", "r3.c", 1],
  ],
  services: [
    ["Section heading", "h.services"],
    ["Section subtitle", "h.servicessub"],
  ],
  how: [["Section heading", "h.how"]],
  work: [
    ["Section heading", "h.work"],
    ["Column — system", "c.system"], ["Column — runtime", "c.runtime"],
    ["Column — domain", "c.domain"], ["Column — year", "c.year"],
    ["Detail — client", "dr.org"], ["Detail — role", "dr.role"],
    ["Detail — status", "dr.status"], ["Detail — in service", "dr.year"],
    ["Detail — in production", "dr.live"], ["Detail — archived", "dr.idle"],
    ["Detail — about", "dr.about"], ["Detail — what it does", "dr.hi"],
    ["Detail — screens", "dr.screens"], ["Detail — figure caption", "dr.fig"],
    ["Detail — PDF button", "dr.pdf"],
    ["Detail — repo button", "dr.repo"],
  ],
  stack: [
    ["Section heading", "h.stack"],
    ["Depth — daily", "d.core"], ["Depth — working", "d.work"], ["Depth — learning", "d.learn"],
  ],
  quality: [
    ["Section heading", "h.qa"],
    ["Paragraph 1", "q.b1", 1], ["Paragraph 2", "q.b2", 1],
    ["Step 1 — name", "q.s1"], ["Step 1 — detail", "q.d1", 1],
    ["Step 2 — name", "q.s2"], ["Step 2 — detail", "q.d2", 1],
    ["Step 3 — name", "q.s3"], ["Step 3 — detail", "q.d3", 1],
    ["Step 4 — name", "q.s4"], ["Step 4 — detail", "q.d4", 1],
  ],
  credentials: [["Section heading", "h.cred"]],
  contact: [
    ["Section heading", "h.contact"],
    ["Field — name", "f.name"], ["Field — email", "f.email"], ["Field — message", "f.msg"],
    ["Submit button", "f.send"],
    ["Sent — heading", "f.ok"], ["Sent — body", "f.okb", 1],
  ],
  footer: [["Footer note", "t.foot"]],
  nav: [
    ["Nav — map", "nav.map"], ["Nav — services", "nav.services"], ["Nav — profile", "nav.profile"],
    ["Nav — path", "nav.path"],
    ["Nav — work", "nav.work"], ["Nav — stack", "nav.stack"], ["Nav — contact", "nav.contact"],
  ],
};

function i18nGroup(keys) {
  const wrap = el("div", { class: "body", style: "padding:0" });
  for (const [label, key, multi] of keys) {
    const t = (STATE.content.i18n[key] ||= ["", ""]);
    wrap.append(el("div", { class: "g2" }, [
      field(label + " — EN", t[0], v => (t[0] = v), multi ? "textarea" : "text"),
      field(label + " — ID", t[1], v => (t[1] = v), multi ? "textarea" : "text"),
    ]));
  }
  return wrap;
}

/* ── generic list editor ──────────────────────────────────────────────── */
function listEditor(arr, title, tag, fieldsFn, makeNew) {
  const host = el("div");
  const draw = () => {
    host.textContent = "";
    arr.forEach((item, i) => {
      const body = el("div", { class: "body" });
      fieldsFn(item, body, i);
      const tools = el("div", { class: "row" }, [
        el("button", { class: "act ghost tiny", type: "button", text: "↑" }),
        el("button", { class: "act ghost tiny", type: "button", text: "↓" }),
        el("button", { class: "act warn tiny", type: "button", text: "Remove" }),
      ]);
      const [up, down, rm] = tools.children;
      up.addEventListener("click", () => { if (i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); draw(); } });
      down.addEventListener("click", () => { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); draw(); } });
      rm.addEventListener("click", () => { if (confirm("Remove this entry?")) { arr.splice(i, 1); draw(); } });
      body.append(tools);
      const card = el("details", { class: "card" }, [
        el("summary", {}, [
          el("strong", { text: title(item) || "(untitled)" }),
          el("span", { class: "tag", text: tag(item) || "" }),
        ]),
        body,
      ]);
      // a short list is easier to read open than as a row of folded summaries
      if (arr.length <= 5) card.setAttribute("open", "");
      host.append(card);
    });
    if (makeNew) {
      const add = el("button", { class: "act ghost", type: "button", text: "+ Add" });
      add.addEventListener("click", () => { arr.push(makeNew()); draw(); });
      host.append(el("div", { class: "row", style: "margin-top:.4rem" }, [add]));
    }
  };
  draw();
  return host;
}

/* ── per-tab structured editors ───────────────────────────────────────── */
function wordmarkEditor() {
  const id = (STATE.content.identity ||= {});
  const wrap = el("div", { class: "body", style: "padding:0" });
  wrap.append(field("Wordmark lines — one per line, the big name at the top",
    lines(id.lines), v => (id.lines = toLines(v)), "textarea"));
  return wrap;
}

function positionEditor() {
  const id = (STATE.content.identity ||= {});
  return listEditor(id.position ||= [], r => r.label?.en, r => r.value,
    (r, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Label — EN", r.label?.en, v => ((r.label ||= {}).en = v)),
        field("Label — ID", r.label?.id, v => ((r.label ||= {}).id = v)),
      ]));
      b.append(field("Value", r.value, v => (r.value = v)));
      b.append(el("div", { class: "row" }, [
        check("Monospace digits", r.num, v => (r.num = v || undefined)),
      ]));
    }, () => ({ label: { en: "", id: "" }, value: "" }));
}

function eyebrowEditor() {
  const id = (STATE.content.identity ||= {});
  return listEditor(id.coords ||= [], c => c.en, c => (c.badge ? "badge" : ""),
    (c, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Text — EN", c.en, v => (c.en = v)),
        field("Text — ID", c.id, v => (c.id = v)),
      ]));
      b.append(el("div", { class: "row" }, [
        check("Show as a badge (outlined, with a live dot)", c.badge, v => (c.badge = v || undefined)),
        check("Monospace digits", c.num, v => (c.num = v || undefined)),
      ]));
    }, () => ({ en: "", id: "" }));
}

function domainsEditor() {
  const doms = (STATE.content.domains ||= []);
  return listEditor(doms, d => d.label?.en, d => d.id,
    (d, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Label — EN", d.label?.en, v => ((d.label ||= {}).en = v)),
        field("Label — ID", d.label?.id, v => ((d.label ||= {}).id = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Id (used by projects)", d.id, v => (d.id = v)),
        field("Vertical position on diagram", d.y, v => (d.y = Number(v) || 0), "number"),
      ]));
    }, () => ({ id: "new", label: { en: "NEW", id: "BARU" }, y: 400 }));
}

function layersEditor() {
  const layers = (STATE.content.layers ||= []);
  return listEditor(layers, l => l.n?.en, l => (l.items || []).length + " items",
    (l, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Layer name — EN", l.n?.en, v => ((l.n ||= {}).en = v)),
        field("Layer name — ID", l.n?.id, v => ((l.n ||= {}).id = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Subtitle — EN", l.s?.en, v => ((l.s ||= {}).en = v)),
        field("Subtitle — ID", l.s?.id, v => ((l.s ||= {}).id = v)),
      ]));
      b.append(el("span", { class: "lbl", text: "Items — name | depth 1-3 | icon (optional)" }));
      const ta = el("textarea", { style: "min-height:130px" });
      ta.value = (l.items || []).map(it => it.join(" | ")).join("\n");
      ta.addEventListener("input", () => {
        l.items = toLines(ta.value).map(row => {
          const [n, d, ic] = row.split("|").map(s => s.trim());
          const out = [n, Number(d) || 1];
          if (ic) out.push(ic);
          return out;
        });
      });
      b.append(ta);
      b.append(el("span", { class: "lbl", text: "icons: " + ICON_NAMES.join(", ") }));
    }, () => ({ n: { en: "New layer", id: "Lapis baru" }, s: { en: "", id: "" }, items: [] }));
}

function projectsEditor() {
  const arr = (STATE.content.projects ||= []);
  const doms = (STATE.content.domains || []).map(d => d.id);
  return listEditor(arr, p => p.name, p => (p.runtime || [])[0],
    (p, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Name", p.name, v => (p.name = v)),
        field("Runtime (comma separated)", (p.runtime || []).join(", "),
          v => (p.runtime = v.split(",").map(s => s.trim()).filter(Boolean))),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Client / org", p.org, v => (p.org = v)),
        field("Year", p.year, v => (p.year = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        select("Domain", p.dom, doms, v => (p.dom = v)),
        select("Sketch", p.sketch, ["donut", "portal", "line", "table", "curve", "phone", "grid"],
          v => (p.sketch = v)),
      ]));
      b.append(mediaField("Portfolio PDF", p.pdf || "", v => (p.pdf = v || null), "porto"));
      b.append(field("Source repository URL", p.repo || "", v => (p.repo = v || undefined)));
      b.append(el("div", { class: "row" }, [
        check("Still in service", p.ongoing, v => (p.ongoing = v || undefined)),
        check("Live (green dot)", p.live, v => (p.live = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Role — EN", p.role?.en, v => ((p.role ||= {}).en = v)),
        field("Role — ID", p.role?.id, v => ((p.role ||= {}).id = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Domain label — EN", p.domain?.en, v => ((p.domain ||= {}).en = v)),
        field("Domain label — ID", p.domain?.id, v => ((p.domain ||= {}).id = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Summary — EN", p.sum?.en, v => ((p.sum ||= {}).en = v), "textarea"),
        field("Summary — ID", p.sum?.id, v => ((p.sum ||= {}).id = v), "textarea"),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("What it does — EN (one per line)", lines(p.hi?.en), v => ((p.hi ||= {}).en = toLines(v)), "textarea"),
        field("What it does — ID (one per line)", lines(p.hi?.id), v => ((p.hi ||= {}).id = toLines(v)), "textarea"),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Screens — EN (one per line)", lines(p.screens?.en), v => ((p.screens ||= {}).en = toLines(v)), "textarea"),
        field("Screens — ID (one per line)", lines(p.screens?.id), v => ((p.screens ||= {}).id = toLines(v)), "textarea"),
      ]));
    },
    () => ({
      id: "new-" + Date.now().toString(36), name: "New project", runtime: [],
      dom: doms[0], y: 400, live: true, year: String(new Date().getFullYear()),
      org: "", role: { en: "", id: "" }, domain: { en: "", id: "" },
      sum: { en: "", id: "" }, hi: { en: [], id: [] }, screens: { en: [], id: [] },
      sketch: "table", pdf: null,
    }));
}

function timelineEditor() {
  const arr = (STATE.content.timeline ||= []);
  return listEditor(arr, t => t.who, t => (t.s || "") + " → " + (t.e || "present"),
    (t, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Organisation", t.who, v => (t.who = v)),
        select("Group", t.g, ["emp", "prog", "edu"], v => (t.g = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Start", t.s, v => (t.s = v), "month"),
        field("End (blank = present)", t.e || "", v => (t.e = v || null), "month"),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Role — EN", t.role?.en, v => ((t.role ||= {}).en = v)),
        field("Role — ID", t.role?.id, v => ((t.role ||= {}).id = v)),
      ]));
      b.append(mediaField("Logo", t.logo || "", v => (t.logo = v || undefined), "logo"));
      b.append(el("div", { class: "row" }, [
        check("Dashed (study / programme)", t.soft, v => (t.soft = v || undefined)),
      ]));
    },
    () => ({ g: "emp", s: new Date().toISOString().slice(0, 7), e: null,
             who: "New entry", role: { en: "", id: "" } }));
}

function servicesEditor() {
  const arr = (STATE.content.services ||= []);
  return listEditor(arr, s => s.ask?.en, s => (s.tags || []).join(" · "),
    (s, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Client's problem — EN", s.ask?.en, v => ((s.ask ||= {}).en = v), "textarea"),
        field("Client's problem — ID", s.ask?.id, v => ((s.ask ||= {}).id = v), "textarea"),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("What you deliver — EN", s.does?.en, v => ((s.does ||= {}).en = v), "textarea"),
        field("What you deliver — ID", s.does?.id, v => ((s.does ||= {}).id = v), "textarea"),
      ]));
      b.append(field("Tags (comma separated, first one is highlighted)", (s.tags || []).join(", "),
        v => (s.tags = v.split(",").map(x => x.trim()).filter(Boolean))));
    },
    () => ({ ask: { en: "", id: "" }, does: { en: "", id: "" }, tags: [] }));
}

function practiceEditor() {
  const arr = (STATE.content.practice ||= []);
  return listEditor(arr, n => n.t?.en, () => "",
    (n, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Heading — EN", n.t?.en, v => ((n.t ||= {}).en = v)),
        field("Heading — ID", n.t?.id, v => ((n.t ||= {}).id = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Detail — EN", n.d?.en, v => ((n.d ||= {}).en = v), "textarea"),
        field("Detail — ID", n.d?.id, v => ((n.d ||= {}).id = v), "textarea"),
      ]));
    },
    () => ({ t: { en: "", id: "" }, d: { en: "", id: "" } }));
}

const PATTERN_LIST = (window.__PATTERNS__ || []);

function appearanceEditor() {
  const app = (STATE.content.appearance ||= { background: "grid" });
  const wrap = el("div", { class: "bgwrap" });
  const paint = () => {
    wrap.querySelectorAll(".bgopt").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.id === app.background)));
  };
  for (const p of PATTERN_LIST) {
    const btn = el("button", { class: "bgopt", type: "button", "data-id": p.id,
                               "aria-pressed": "false" }, [
      el("div", { class: "prev sw-" + p.id }),
      el("div", { class: "cap" }, [
        el("b", { text: p.label }),
        el("span", { text: p.note }),
      ]),
    ]);
    btn.addEventListener("click", () => { app.background = p.id; paint(); });
    wrap.append(btn);
  }
  paint();
  return wrap;
}

function statsEditor() {
  const arr = (STATE.content.stats ||= []);
  return listEditor(arr, s => s.en, s => String(s.n),
    (s, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Number", s.n, v => (s.n = v)),
        field("Decimal places (blank = whole)", s.dec ?? "", v => (s.dec = v ? Number(v) : undefined), "number"),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Caption — EN", s.en, v => (s.en = v)),
        field("Caption — ID", s.id, v => (s.id = v)),
      ]));
    }, () => ({ n: "0", en: "", id: "" }));
}

function credentialsEditor() {
  const arr = (STATE.content.credentials ||= []);
  return listEditor(arr, c => c.en, c => String(c.year),
    (c, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Year", c.year, v => (c.year = v)),
        field("Issuer", c.issuer, v => (c.issuer = v)),
      ]));
      b.append(el("div", { class: "g2" }, [
        field("Title — EN", c.en, v => (c.en = v)),
        field("Title — ID", c.id, v => (c.id = v)),
      ]));
    }, () => ({ year: String(new Date().getFullYear()), issuer: "", en: "", id: "" }));
}

function contactEditor() {
  const arr = (STATE.content.contact ||= []);
  return listEditor(arr, c => c.en,
    c => (c.value && typeof c.value === "object" ? c.value.en : c.value),
    (c, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Label — EN", c.en, v => (c.en = v)),
        field("Label — ID", c.id, v => (c.id = v)),
      ]));
      // The shown text is a plain string for rows that read the same in both
      // languages — an address, a phone number — and {en,id} for the ones that
      // do not, such as the CV row's "See PDF" / "Lihat PDF". Editing it as a
      // single field rendered the object as [object Object] and turned it into
      // a string on the first keystroke, which silently dropped the ID label.
      const bilingual = c.value && typeof c.value === "object";
      const pair = {
        en: bilingual ? c.value.en ?? "" : c.value ?? "",
        id: bilingual ? c.value.id ?? c.value.en ?? "" : c.value ?? "",
      };
      const writeValue = () => {
        c.value = pair.en === pair.id ? pair.en : { en: pair.en, id: pair.id };
      };
      b.append(el("div", { class: "g2" }, [
        field("Shown value — EN", pair.en, v => { pair.en = v; writeValue(); }),
        field("Shown value — ID", pair.id, v => { pair.id = v; writeValue(); }),
      ]));
      b.append(field("Link (href)", c.href, v => (c.href = v)));
      b.append(mediaField("…or pick a file to link to", c.href || "", v => (c.href = v), "cv"));
      b.append(el("div", { class: "row" }, [
        check("Monospace digits", c.num, v => (c.num = v || undefined)),
        check("Accent colour", c.accent, v => (c.accent = v || undefined)),
        check("Download attribute", c.download, v => (c.download = v || undefined)),
        check("Opens the in-page PDF viewer", c.viewer, v => (c.viewer = v || undefined)),
      ]));
    }, () => ({ en: "", id: "", value: "", href: "" }));
}

function footerEditor() {
  const arr = (STATE.content.footer ||= []);
  return listEditor(arr, f => f.en, f => f.value || f.dynamic || "",
    (f, b) => {
      b.append(el("div", { class: "g2" }, [
        field("Label — EN", f.en, v => (f.en = v)),
        field("Label — ID", f.id, v => (f.id = v)),
      ]));
      b.append(field("Value", f.value, v => (f.value = v)));
      b.append(el("div", { class: "row" }, [
        check("Monospace digits", f.num, v => (f.num = v || undefined)),
        check("Live view counter (ignores value)", f.dynamic === "views",
          v => (f.dynamic = v ? "views" : undefined)),
      ]));
    }, () => ({ en: "", id: "", value: "" }));
}

/** What Google prints and what a pasted link unfurls into. Not bilingual:
 *  a page has one title, and search engines index the served one. */
function seoEditor() {
  const s = (STATE.content.seo ||= {});
  const wrap = el("div", { class: "body", style: "padding:0" });

  const counted = (label, value, oninput, limit, type = "text") => {
    const f = field(label, value, v => { oninput(v); paint(v); }, type);
    const tag = el("span", { class: "hint", style: "float:right;font-variant-numeric:tabular-nums" });
    const paint = v => {
      const n = (v || "").length;
      tag.textContent = n + " / " + limit;
      tag.style.color = n > limit ? "var(--signal)" : "";
    };
    paint(value);
    f.querySelector(".lbl").append(tag);
    return f;
  };

  wrap.append(counted("Browser tab & search result title", s.title,
    v => (s.title = v), 60));
  wrap.append(counted("Search result description", s.description,
    v => (s.description = v), 160, "textarea"));
  wrap.append(field("Site address — canonical, and what relative image paths resolve against",
    s.url, v => (s.url = v)));

  wrap.append(el("p", { class: "hint", style: "margin:18px 0 6px",
    text: "Shown when the link is pasted into WhatsApp, LinkedIn, Slack or X. Leave the two blank to reuse the pair above." }));
  wrap.append(field("Link preview — title", s.ogTitle, v => (s.ogTitle = v)));
  wrap.append(field("Link preview — description", s.ogDescription,
    v => (s.ogDescription = v), "textarea"));
  wrap.append(mediaField("Link preview — image (1200×630)", s.image,
    v => (s.image = v), "img"));
  return wrap;
}

/* ── tabs ─────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "hero",    name: "Hero",
    hint: "The first screen, top to bottom: the eyebrow line, the big name, the statement beside it, and the four-row position table on the right.",
    parts: [
      ["Eyebrow items — the small line above the name", eyebrowEditor],
      ["Wordmark — the big name", wordmarkEditor],
      ["Opening statement", () => i18nGroup(FIELDS.hero)],
      ["Position rows — Role / Posted to / Via / Since", positionEditor],
    ] },
  { id: "map",     name: "Map",     hint: "The system diagram: its caption, legend, and the domain boxes projects hang from.",
    parts: [["Headings & labels", () => i18nGroup(FIELDS.map)], ["Domains", domainsEditor]] },
  { id: "services", name: "Services", hint: "The offer. Lead with the client's problem in their words — the stack comes second.",
    parts: [["Service offers", servicesEditor], ["Headings & labels", () => i18nGroup(FIELDS.services)]] },
  { id: "profile", name: "Profile", hint: "Bio paragraphs, the spec table beside the portrait, and the counters above them.",
    parts: [["Headings & labels", () => i18nGroup(FIELDS.profile)], ["Counter strip", statsEditor]] },
  { id: "path",    name: "Path",    hint: "The timeline. Leave an end date blank for anything still running.",
    parts: [["Timeline entries", timelineEditor], ["Headings & labels", () => i18nGroup(FIELDS.path)]] },
  { id: "work",    name: "Work",    hint: "Every project in the register, and the labels around it.",
    parts: [["Projects", projectsEditor], ["Headings & labels", () => i18nGroup(FIELDS.work)]] },
  { id: "stack",   name: "Stack",   hint: "Technology layers. Each item is: name | depth 1-3 | icon.",
    parts: [["Layers", layersEditor], ["Headings & labels", () => i18nGroup(FIELDS.stack)]] },
  { id: "quality", name: "Quality", hint: "The testing-background section.",
    parts: [["Headings & labels", () => i18nGroup(FIELDS.quality)]] },
  { id: "how",     name: "Working together", hint: "The objections a remote client actually has: testing, process, timezone, secrets.",
    parts: [["Trust notes", practiceEditor], ["Headings & labels", () => i18nGroup(FIELDS.how)]] },
  { id: "cred",    name: "Credentials", hint: "The stamps. They tilt automatically, alternating direction.",
    parts: [["Certificate stamps", credentialsEditor], ["Headings & labels", () => i18nGroup(FIELDS.credentials)]] },
  { id: "contact", name: "Contact", hint: "Form labels and the direct links beside it.",
    parts: [["Contact routes", contactEditor], ["Headings & labels", () => i18nGroup(FIELDS.contact)]] },
  { id: "footer",  name: "Footer",  hint: "The drawing title block at the bottom.",
    parts: [["Title-block rows", footerEditor], ["Headings & labels", () => i18nGroup(FIELDS.footer)], ["Navigation", () => i18nGroup(FIELDS.nav)]] },
  { id: "look",    name: "Appearance", hint: "The background pattern behind every section. Previews are rendered from the same declarations the page uses, so what you pick is what you get.",
    parts: [["Background", appearanceEditor]] },
  { id: "seo",     name: "Sharing", hint: "The tab title, the search-result snippet, and the card people see when they paste your link. Facebook, LinkedIn and WhatsApp cache these hard — after changing the image, run the link through their debugger to force a refresh.",
    parts: [["Title, description, link preview", seoEditor]] },
  { id: "media",   name: "Media",   hint: "Logos, portrait, portfolio PDFs, CV. Live the moment they finish uploading." },
  { id: "raw",     name: "Advanced", hint: "Raw JSON, for anything the forms above do not cover." },
];

const SAVE_ALL = ["identity", "i18n", "domains", "projects", "layers", "timeline",
                  "stats", "credentials", "contact", "footer", "services", "practice",
                  "appearance", "seo"];

function renderTab(tab) {
  const sec = el("section", { id: "tab-" + tab.id });
  sec.append(el("h2", { text: tab.name }), el("p", { class: "hint", text: tab.hint }));

  if (tab.id === "media") { sec.append(mediaPanel()); return sec; }
  if (tab.id === "raw") { sec.append(rawPanel()); return sec; }

  for (const [title, make] of tab.parts) {
    sec.append(el("h3", { text: title }));
    sec.append(make());
  }
  const msg = el("span", { class: "msg" });
  const btn = el("button", { class: "act", type: "button", text: "Save" });
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    let ok = true;
    for (const k of SAVE_ALL) if (STATE.content[k] !== undefined) ok = (await save(k, STATE.content[k])) && ok;
    btn.disabled = false;
    msg.textContent = ok ? "saved — live in a few seconds" : "save failed";
    msg.className = "msg " + (ok ? "ok" : "bad");
    setTimeout(() => { msg.textContent = ""; }, 4000);
  });
  sec.append(el("div", { class: "bar" }, [btn, msg]));
  return sec;
}

function mediaPanel() {
  const wrap = el("div");
  const drop = el("div", { class: "drop", id: "drop" });
  const folder = el("select", { style: "width:auto;display:inline-block" });
  for (const f of ["logo", "img", "porto", "cv"]) folder.append(el("option", { value: f, text: f }));
  drop.append(
    el("div", { text: "Drop files here, or use the button" }),
    el("div", { class: "row", style: "justify-content:center;margin-top:.6rem" }, [
      el("span", { class: "lbl", text: "folder" }), folder,
      (() => { const b = el("button", { class: "act", type: "button", text: "Choose files" });
               b.addEventListener("click", () => { pickFolder = folder.value; $("#hiddenFile").click(); });
               return b; })(),
    ]),
  );
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("hot"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("hot"); }));
  drop.addEventListener("drop", e => { pickFolder = folder.value; upload(e.dataTransfer.files); });

  const tbody = el("tbody", { id: "media" });
  wrap.append(drop, el("table", {}, [
    el("thead", {}, [el("tr", {}, [el("th"), el("th", { text: "Path" }), el("th", { text: "Type" }),
                                   el("th", { text: "Size" }), el("th")])]),
    tbody,
  ]), el("div", { class: "bar" }, [el("span", { class: "msg", id: "msg3" })]));
  setTimeout(renderMedia, 0);
  return wrap;
}

function renderMedia() {
  const tb = $("#media"); if (!tb) return;
  tb.textContent = "";
  for (const m of STATE.media) {
    const isImg = /^image\//.test(m.type);
    const tr = el("tr", {}, [
      el("td", {}, [isImg ? el("img", { src: "/m/" + m.key, alt: "" }) : el("span", { class: "lbl", text: "PDF" })]),
      el("td", { class: "k", text: "/m/" + m.key }),
      el("td", { class: "lbl", text: m.type }),
      el("td", { class: "lbl", text: (m.size / 1024).toFixed(0) + " KB" }),
      el("td", {}, [el("button", { class: "act warn tiny", type: "button", text: "Delete" })]),
    ]);
    tr.querySelector("button").addEventListener("click", async () => {
      if (!confirm("Delete " + m.key + "?")) return;
      await fetch("/api/admin/media?key=" + encodeURIComponent(m.key), { method: "DELETE" });
      await load();
    });
    tb.append(tr);
  }
}

function rawPanel() {
  const host = el("div");
  for (const k of Object.keys(STATE.content)) {
    const ta = el("textarea", { style: "min-height:240px;font-family:ui-monospace,monospace;font-size:12px" });
    ta.value = JSON.stringify(STATE.content[k], null, 2);
    const err = el("div", { class: "err" });
    const btn = el("button", { class: "act", type: "button", text: "Save " + k });
    btn.addEventListener("click", async () => {
      let parsed;
      try { parsed = JSON.parse(ta.value); }
      catch (e) { err.className = "err"; err.textContent = "Invalid JSON: " + e.message; return; }
      STATE.content[k] = parsed;
      const ok = await save(k, parsed);
      err.className = ok ? "lbl" : "err";
      err.textContent = ok ? "saved" : "save failed";
    });
    host.append(el("details", { class: "card" }, [
      el("summary", {}, [el("strong", { text: k })]),
      el("div", { class: "body" }, [ta, err, el("div", { class: "row" }, [btn])]),
    ]));
  }
  return host;
}

/* ── media picker modal ───────────────────────────────────────────────── */
function openPicker(folder, onPick) {
  pickTarget = onPick; pickFolder = folder;
  const grid = $("#mgrid");
  grid.textContent = "";
  const items = STATE.media.filter(m => !folder || m.key.startsWith(folder + "/"));
  if (!items.length) grid.append(el("p", { class: "hint", style: "padding:1rem", text: "Nothing in " + folder + "/ yet — upload one." }));
  for (const m of items) {
    const isImg = /^image\//.test(m.type);
    const cell = el("div", { class: "mitem" }, [
      isImg ? el("img", { src: "/m/" + m.key, alt: "" }) : el("div", { class: "pdf", text: "PDF" }),
      el("div", { class: "n", text: m.key }),
    ]);
    cell.addEventListener("click", () => { onPick("/m/" + m.key); closePicker(); });
    grid.append(cell);
  }
  $("#modal").classList.add("on");
}
function closePicker() { $("#modal").classList.remove("on"); pickTarget = null; }
$("#mClose").addEventListener("click", closePicker);
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closePicker(); });
$("#mUpload").addEventListener("click", () => $("#hiddenFile").click());
$("#hiddenFile").addEventListener("change", e => upload(e.target.files));

async function upload(files) {
  for (const f of files) {
    const fd = new FormData();
    fd.append("file", f); fd.append("folder", pickFolder);
    const r = await fetch("/api/admin/media", { method: "POST", body: fd });
    if (!r.ok) { alert("Upload failed for " + f.name + ": " + (await r.text())); return; }
    const out = await r.json();
    if (pickTarget) { pickTarget(out.path); closePicker(); }
  }
  await load();
}

/* ── plumbing ─────────────────────────────────────────────────────────── */
async function save(key, value) {
  const r = await fetch("/api/admin/section/" + key, {
    method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
  return r.ok;
}

// Fixed set bundled into the public page; listed here so the Stack editor can
// tell you which icon names are valid.
const ICON_NAMES = ["appium","codeigniter","css","django","html5","javascript",
                    "laravel","mysql","php","postgresql","python","swift","xcode"];
function paint() {
  const main = $("#main"), tabs = $("#tabs");
  const current = document.querySelector("section.on")?.id;
  main.textContent = ""; tabs.textContent = "";
  for (const t of TABS) {
    const b = el("button", { type: "button", text: t.name });
    b.addEventListener("click", () => {
      document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("on", x === b));
      document.querySelectorAll("section").forEach(s => s.classList.toggle("on", s.id === "tab-" + t.id));
    });
    tabs.append(b);
    main.append(renderTab(t));
  }
  const want = current || "tab-hero";
  const target = document.getElementById(want) || document.getElementById("tab-hero");
  target.classList.add("on");
  const idx = TABS.findIndex(t => "tab-" + t.id === target.id);
  tabs.children[Math.max(idx, 0)].classList.add("on");
}

async function load() {
  const res = await fetch("/api/admin/state");
  if (!res.ok) { document.body.innerHTML = "<p style='padding:2rem'>Not authorised.</p>"; return; }
  STATE = await res.json();
  STATE.content.i18n ||= {};
  paint();
}
load();
</script>
</body>
</html>`;
