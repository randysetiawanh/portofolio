import test from "node:test";
import assert from "node:assert/strict";
import { attr, seoBlock } from "../src/render.ts";

test("attr meng-escape empat karakter yang bisa keluar dari atribut", () => {
  assert.equal(attr(`&<>"`), "&amp;&lt;&gt;&quot;");
});

test("attr meng-escape ampersand lebih dulu, tidak dobel", () => {
  assert.equal(attr("&lt;"), "&amp;lt;");
});

test("attr mengubah nullish jadi string kosong, bukan \"null\"", () => {
  assert.equal(attr(null), "");
  assert.equal(attr(undefined), "");
  assert.equal(attr(0), "0");
});

test("kutip di judul tidak bisa menutup atribut lebih awal", () => {
  const out = seoBlock({ title: `X" onload="alert(1)` }, "FALLBACK");
  assert.ok(!out.includes(`onload="`), out);
  assert.ok(out.includes("&quot;"));
});

test("tanpa judul, fallback dikembalikan apa adanya", () => {
  assert.equal(seoBlock(undefined, "FALLBACK"), "FALLBACK");
  assert.equal(seoBlock({}, "FALLBACK"), "FALLBACK");
  assert.equal(seoBlock({ description: "ada" }, "FALLBACK"), "FALLBACK");
});

test("path gambar relatif dijadikan absolut", () => {
  const out = seoBlock({ title: "T", url: "https://x.dev/", image: "/m/img/og.png" }, "F");
  assert.ok(out.includes(`property="og:image" content="https://x.dev/m/img/og.png"`), out);
});

test("slash berlebih di url situs dirapikan", () => {
  const out = seoBlock({ title: "T", url: "https://x.dev///", image: "m/og.png" }, "F");
  assert.ok(out.includes(`content="https://x.dev/m/og.png"`), out);
  assert.ok(out.includes(`rel="canonical" href="https://x.dev/"`), out);
});

test("url gambar yang sudah absolut tidak disentuh", () => {
  for (const u of ["https://cdn.x/og.png", "HTTP://cdn.x/og.png"]) {
    const out = seoBlock({ title: "T", url: "https://x.dev/", image: u }, "F");
    assert.ok(out.includes(`property="og:image" content="${u}"`), u);
  }
});

test("tanpa gambar, kartu turun ke summary dan og:image tidak dirender", () => {
  const out = seoBlock({ title: "T" }, "F");
  assert.ok(!out.includes("og:image"), out);
  assert.ok(out.includes(`name="twitter:card" content="summary"`));
});

test("dengan gambar, kartunya summary_large_image", () => {
  const out = seoBlock({ title: "T", image: "/a.png" }, "F");
  assert.ok(out.includes(`content="summary_large_image"`), out);
});

test("ogTitle dan ogDescription jatuh ke pasangan utama saat kosong", () => {
  const out = seoBlock({ title: "Judul", description: "Desk" }, "F");
  assert.ok(out.includes(`property="og:title" content="Judul"`), out);
  assert.ok(out.includes(`property="og:description" content="Desk"`), out);
});

test("ogTitle dan ogDescription menang saat diisi", () => {
  const out = seoBlock(
    { title: "Judul", description: "Desk", ogTitle: "OG", ogDescription: "OGD" }, "F");
  assert.ok(out.includes(`property="og:title" content="OG"`), out);
  assert.ok(out.includes(`property="og:description" content="OGD"`), out);
  assert.ok(out.includes("<title>Judul</title>"), out);
});

test("url default dipakai kalau seo.url kosong", () => {
  const out = seoBlock({ title: "T", image: "og.png" }, "F");
  assert.ok(out.includes("https://rancores.space/og.png"), out);
});
