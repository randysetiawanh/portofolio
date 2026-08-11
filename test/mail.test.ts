import test from "node:test";
import assert from "node:assert/strict";
import { headerSafe, base64, encodeHeader, buildMime } from "../src/mail.ts";

test("headerSafe membuang CR dan LF — ini pertahanan header injection", () => {
  assert.equal(headerSafe("Randy\r\nBcc: korban@x.co"), "Randy Bcc: korban@x.co");
  assert.equal(headerSafe("a\nb\rc"), "a b c");
  assert.equal(headerSafe("  spasi ujung \n"), "spasi ujung");
});

test("base64 menangani non-ASCII lewat UTF-8, bukan charCode mentah", () => {
  assert.equal(base64("halo"), "aGFsbw==");
  assert.equal(base64("halo é"), Buffer.from("halo é", "utf8").toString("base64"));
  assert.equal(base64("日本語"), Buffer.from("日本語", "utf8").toString("base64"));
});

test("encodeHeader membiarkan ASCII apa adanya", () => {
  assert.equal(encodeHeader("Randy Setiawan"), "Randy Setiawan");
});

test("encodeHeader membungkus non-ASCII sesuai RFC 2047", () => {
  const out = encodeHeader("Café");
  assert.ok(out.startsWith("=?utf-8?B?"), out);
  assert.ok(out.endsWith("?="), out);
  assert.equal(
    Buffer.from(out.slice("=?utf-8?B?".length, -2), "base64").toString("utf8"), "Café");
});

const mime = (over: Partial<Parameters<typeof buildMime>[0]> = {}) =>
  buildMime({
    from: "form@rancores.space", to: "randy@x.co",
    replyName: "Randy", replyTo: "randy@x.co",
    subject: "Halo", body: "isi pesan", ...over,
  });

test("header wajib hadir semua", () => {
  const m = mime();
  for (const h of ["From:", "To:", "Reply-To:", "Subject:", "Message-ID:", "Date:",
                   "MIME-Version: 1.0", "Content-Transfer-Encoding: base64"]) {
    assert.ok(m.includes(h), h);
  }
});

test("baris dipisah CRLF, dan header dipisah dari body oleh baris kosong", () => {
  const m = mime();
  assert.ok(m.includes("\r\n\r\n"), "tidak ada pemisah header/body");
  assert.ok(!/[^\r]\n/.test(m.split("\r\n\r\n")[0]), "ada LF telanjang di header");
});

test("body di-encode base64 dan bisa dibaca balik", () => {
  const m = mime({ body: "isi pesan" });
  const body = m.split("\r\n\r\n").slice(1).join("\r\n\r\n").replace(/\r\n/g, "");
  assert.equal(Buffer.from(body, "base64").toString("utf8"), "isi pesan");
});

test("baris base64 dipatahkan pada 76 karakter", () => {
  const m = mime({ body: "x".repeat(5000) });
  const lines = m.split("\r\n\r\n").slice(1).join("\r\n\r\n").split("\r\n");
  for (const l of lines) assert.ok(l.length <= 76, `baris ${l.length} karakter`);
});

test("Message-ID memakai domain pengirim", () => {
  assert.match(mime().match(/^Message-ID: <(.+)>$/m)![1], /@rancores\.space$/);
});

test("pengirim tanpa @ jatuh ke localhost, tidak menghasilkan Message-ID rusak", () => {
  assert.match(mime({ from: "rusak" }).match(/^Message-ID: <(.+)>$/m)![1], /@localhost$/);
});

test("dua pesan tidak pernah berbagi Message-ID", () => {
  const id = (m: string) => m.match(/^Message-ID: <(.+)>$/m)![1];
  assert.notEqual(id(mime()), id(mime()));
});

test("subject non-ASCII di-encode, bukan dikirim mentah", () => {
  assert.ok(mime({ subject: "Pertanyaan — Café" }).includes("=?utf-8?B?"));
});
