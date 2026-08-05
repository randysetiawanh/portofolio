import { readFileSync, writeFileSync } from "node:fs";

const SLOT = "<!--content-slot-->";
const shell = readFileSync("public/index.html", "utf8");
const raw = readFileSync(process.argv[2] ?? "/tmp/live-content.json", "utf8");
const out = process.argv[3] ?? "/tmp/pathprev/live.html";

const data = JSON.parse(raw);
delete data.version;

const payload = JSON.stringify(data)
  .replace(/"\/m\//g, '"https://rancores.space/m/')
  .replace(/</g, "\\u003c");

if (!shell.includes(SLOT)) {
  console.error("content slot missing");
  process.exit(1);
}

const bg = data.appearance?.background ?? "grid";
writeFileSync(
  out,
  shell.replace(
    SLOT,
    `<script>window.__CONTENT__=${payload};</script>` +
      `<script>document.documentElement.setAttribute("data-bg",${JSON.stringify(bg)})</script>`,
  ),
);
console.log(`${out} — ${Math.round(shell.length / 1024)} KB shell, bg=${bg}`);
