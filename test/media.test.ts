import test from "node:test";
import assert from "node:assert/strict";
import { safeMediaKey, SECTIONS } from "../src/content.ts";

test("hanya empat folder yang diizinkan", () => {
  for (const f of ["logo", "porto", "img", "cv"]) {
    assert.equal(safeMediaKey(f, "a.png"), `${f}/a.png`, f);
  }
  for (const f of ["", "tmp", "etc", "vendor", "..", "/"]) {
    assert.equal(safeMediaKey(f, "a.png"), null, f);
  }
});

test("nama folder dinormalkan sebelum dicocokkan", () => {
  assert.equal(safeMediaKey("LOGO", "a.png"), "logo/a.png");
  assert.equal(safeMediaKey("i m g", "a.png"), "img/a.png");
});

/* Yang dijamin bukan "input jahat ditolak", tapi "key yang keluar selalu jinak":
   tepat satu garis miring, folder dari allowlist, dan tidak ada ".." di
   dalamnya. Menormalkan lebih berguna daripada menolak — unggahan dari Finder
   atau Windows Explorer penuh karakter yang bukan serangan. */
const SAFE = /^(logo|porto|img|cv)\/[a-z0-9._-]+$/;

test("apa pun masukannya, key yang keluar tetap jinak", () => {
  const nasty = [
    "../../etc/passwd", "..%2f..%2fetc", "a/b/c.png", "....//....//x",
    "C:\\Users\\randy\\cv.pdf", "a\u0000b.png", "%2e%2e%2fx", "\u202Egnp.exe",
  ];
  for (const n of nasty) {
    const key = safeMediaKey("img", n);
    if (key === null) continue;
    assert.match(key, SAFE, `${JSON.stringify(n)} → ${key}`);
    assert.ok(!key.includes(".."), `${key} masih memuat ..`);
    assert.equal(key.split("/").length, 2, `${key} bukan satu ruas`);
  }
});

test("folder juga dinormalkan, bukan dipakai mentah", () => {
  // "../logo" menyusut jadi "logo" karena titik dan garis miring dibuang.
  assert.equal(safeMediaKey("../logo", "a.png"), "logo/a.png");
  assert.equal(safeMediaKey("img/../cv", "a.png"), null);
});

test("nama yang menyisakan .. ditolak", () => {
  assert.equal(safeMediaKey("img", "..%2f..%2fetc"), null);
});

test("nama file dinormalkan, bukan ditolak", () => {
  assert.equal(safeMediaKey("img", "Foto Randy (1).PNG"), "img/foto-randy-1-.png");
  assert.equal(safeMediaKey("img", "a___b.png"), "img/a___b.png");
  assert.equal(safeMediaKey("img", "a   b.png"), "img/a-b.png");
});

test("titik dan strip di ujung dibuang", () => {
  assert.equal(safeMediaKey("img", "...a.png..."), "img/a.png");
  assert.equal(safeMediaKey("img", "---a.png---"), "img/a.png");
});

test("nama yang menyusut jadi kosong ditolak", () => {
  for (const n of ["", "...", "---", "///", "   "]) {
    assert.equal(safeMediaKey("img", n), null, JSON.stringify(n));
  }
});

test("nama dipotong 80 karakter", () => {
  const key = safeMediaKey("img", "x".repeat(200) + ".png");
  assert.ok(key);
  assert.equal(key!.slice(4).length, 80);
});

test("daftar section tidak punya duplikat", () => {
  assert.equal(new Set(SECTIONS).size, SECTIONS.length);
});
