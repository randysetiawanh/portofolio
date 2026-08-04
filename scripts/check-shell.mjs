/**
 * Pre-deploy gate for public/index.html.
 *
 * Written after shipping a page whose entire stylesheet had been duplicated
 * into <body> as plain text. Every check that ran at the time passed, because
 * they all asked "is X present?" — none asked "is X present exactly once, and
 * is anything else there that should not be?". These do.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FILE = process.argv[2] ?? "public/index.html";
const html = readFileSync(FILE, "utf8");
const fail = [];
const ok = [];
const check = (label, cond, detail = "") =>
  cond ? ok.push(label) : fail.push(label + (detail ? ` — ${detail}` : ""));

const count = (s) => html.split(s).length - 1;
const at = (s) => html.indexOf(s);

/* structure: exactly one of each, in the right order */
for (const tag of ["<html", "</html>", "<head>", "</head>", "<body>", "</body>", "<style>", "</style>"]) {
  check(`one ${tag}`, count(tag) === 1, `found ${count(tag)}`);
}
check("stylesheet lives in <head>", at("<style>") > at("<head>") && at("</style>") < at("</head>"));
check("body opens after head closes", at("<body>") > at("</head>"));

/* the Worker injects here; a missing or duplicated slot means the page ships
   without content, or content lands in the wrong place */
check("exactly one content slot", count("<!--content-slot-->") === 1, `found ${count("<!--content-slot-->")}`);
check("slot sits in <head>", at("<!--content-slot-->") < at("</head>"));

/* the SEO block is spliced out by offset, so both markers must exist exactly
   once and in order — reversed or missing, the page ships an untitled head */
for (const m of ["<!--seo-start-->", "<!--seo-end-->"])
  check(`one ${m}`, count(m) === 1, `found ${count(m)}`);
check("seo markers ordered and in <head>",
      at("<!--seo-start-->") < at("<!--seo-end-->") && at("<!--seo-end-->") < at("</head>"));
/* the fallback between them has to stand on its own if the doc is missing */
const seoFallback = html.slice(at("<!--seo-start-->"), at("<!--seo-end-->"));
check("fallback <title> inside the seo block", /<title>[^<]+<\/title>/.test(seoFallback));
check("only one <title> in the shell", count("<title>") === 1, `found ${count("<title>")}`);
check("og:image is absolute or /m/", /og:image" content="(https?:\/\/|\/m\/)/.test(seoFallback));

/* the theme has to resolve before anything paints */
check("theme bootstrap present once", count("localStorage.getItem(\"theme\")") === 1);
check("theme bootstrap in <head>", at("localStorage.getItem(\"theme\")") < at("</head>"));
check("dark is the base (no OS query)", !html.includes("prefers-color-scheme"));
check("reduced motion still honoured", html.includes("prefers-reduced-motion"));

/* no stray CSS rendering as text: the body must contain no bare rule blocks */
const body = html.slice(at("<body>"));
const bodyNoScripts = body.replace(/<script>[\s\S]*?<\/script>/g, "");
const loose = bodyNoScripts.match(/^\s*[.#@][\w\-[\]"=]+\s*\{/gm) || [];
check("no loose CSS in <body>", loose.length === 0, loose.slice(0, 3).join(" "));

/* CSS integrity */
const css = html.slice(at("<style>") + 7, at("</style>"));
check("CSS braces balanced", css.split("{").length === css.split("}").length);
check("three @font-face blocks", (css.match(/@font-face/g) || []).length === 3);

/* markup balance */
const VOID = new Set(["br","hr","img","input","meta","link","source","path","circle","rect","line","polyline","use","i"]);
const stack = [];
const markup = bodyNoScripts.replace(/<style>[\s\S]*?<\/style>/g, "");
for (const m of markup.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
  const [, close, rawTag, , selfClose] = m;
  const tag = rawTag.toLowerCase();
  if (VOID.has(tag) || selfClose) continue;
  if (close) { if (stack.at(-1) === tag) stack.pop(); }
  else stack.push(tag);
}
check("markup balanced", stack.length === 0, stack.slice(0, 4).join(", "));

/* the page script must parse */
const script = html.match(/<script>\n\(function\(\)\{\n"use strict"[\s\S]*?\n\}\)\(\);\n<\/script>/);
if (!script) fail.push("main page script not found");
else {
  const tmp = join(tmpdir(), `shell-check-${process.pid}.js`);
  writeFileSync(tmp, script[0].slice(8, -9));
  try { execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" }); ok.push("page script parses"); }
  catch (e) { fail.push("page script syntax — " + String(e.stderr).split("\n")[1]); }
  finally { unlinkSync(tmp); }
}

/* ── the admin page, built the way the Worker builds it ──────────────────
   The admin is behind Access and cannot be fetched, so a broken template
   only shows up as a blank page in someone's browser. It shipped blank once
   because a placeholder was replaced into `[...][]`. Check it here instead. */
const adminSrc = readFileSync("src/admin-ui.ts", "utf8");
const template = adminSrc.split("String.raw`")[1]?.split("`;")[0] ?? "";
check("admin template extracted", template.length > 1000);

const filled = template
  .replace("/*__SWATCH_CSS__*/", ":root{--ga:red}.sw-grid{background:none}")
  .replace("/*__PATTERN_DATA__*/", 'window.__PATTERNS__=[{"id":"grid","label":"L","note":"n"}];');

const PLACEHOLDER = /\/\*__[A-Z_]+__\*\//g;
check("no placeholder left unfilled", !PLACEHOLDER.test(filled),
      (filled.match(PLACEHOLDER) || []).join(" "));

// every script in the admin must parse — both filled and, so it fails soft,
// with the placeholders still in place
for (const [label, doc] of [["filled", filled], ["un-substituted", template]]) {
  let n = 0, bad = 0;
  for (const m of doc.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    n++;
    const tmp = join(tmpdir(), `admin-check-${process.pid}-${n}.js`);
    writeFileSync(tmp, m[1]);
    try { execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" }); }
    catch (e) { bad++; fail.push(`admin script ${n} (${label}) — ` + String(e.stderr).split("\n")[2]); }
    finally { unlinkSync(tmp); }
  }
  if (!bad) ok.push(`admin scripts parse (${label}, ${n})`);
}

/* ── background patterns ────────────────────────────────────────────────
   These are assembled by string concatenation, so a stray separator produces
   CSS that parses as nothing and silently drops the pattern. */
const patSrc = readFileSync("src/patterns.ts", "utf8");
const decls = [...patSrc.matchAll(/\bcss(?:Light)?:\s*([\s\S]*?)(?=\n\s*(?:cssLight:|\}|\{ id:))/g)]
  .map((m) => m[1]);
check("pattern declarations found", decls.length >= 20, `found ${decls.length}`);

const malformed = [];
for (const d of decls) {
  // trailing comma belongs to the object literal, not the CSS
  const flat = d.replace(/`|\s*\+\s*/g, "").replace(/[\s,]+$/, "");
  if (/;\s*,/.test(flat) || /,\s*;/.test(flat)) malformed.push("stray separator");
  const open = (flat.match(/\(/g) || []).length, close = (flat.match(/\)/g) || []).length;
  if (open !== close) malformed.push(`unbalanced parens (${open}/${close})`);
}
check("pattern CSS well formed", malformed.length === 0, [...new Set(malformed)].join(", "));

for (const l of ok) console.log(`  ok   ${l}`);
for (const l of fail) console.log(`  FAIL ${l}`);
console.log(`\n${ok.length} passed, ${fail.length} failed — ${Math.round(html.length / 1024)} KB`);
if (fail.length) {
  console.error("\nShell is not fit to deploy.");
  process.exit(1);
}
