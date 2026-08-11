import test from "node:test";
import assert from "node:assert/strict";
import { validateContact, MAX } from "../src/validate.ts";

const good = { name: "Randy", email: "a@b.co", message: "halo", token: "t" };

test("menerima kiriman yang lengkap dan memangkas spasi", () => {
  const r = validateContact({ ...good, name: "  Randy  ", email: " a@b.co " });
  assert.equal(r.ok, true);
  assert.deepEqual(r.ok && r.fields, {
    name: "Randy", email: "a@b.co", message: "halo", token: "t",
  });
});

test("field kosong ditolak 400 incomplete", () => {
  for (const k of ["name", "email", "message"]) {
    const r = validateContact({ ...good, [k]: "" });
    assert.deepEqual(r, { ok: false, error: "incomplete", status: 400 }, k);
  }
});

test("field berisi spasi saja sama dengan kosong", () => {
  const r = validateContact({ ...good, message: "   \n\t " });
  assert.deepEqual(r, { ok: false, error: "incomplete", status: 400 });
});

test("field yang hilang sama sekali ditolak, bukan jadi \"undefined\"", () => {
  const r = validateContact({});
  assert.deepEqual(r, { ok: false, error: "incomplete", status: 400 });
});

test("melewati batas panjang ditolak 413", () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["name", { ...good, name: "x".repeat(MAX.name + 1) }],
    ["email", { ...good, email: "x".repeat(MAX.email - 4) + "@b.co" }],
    ["message", { ...good, message: "x".repeat(MAX.message + 1) }],
  ];
  for (const [label, body] of cases) {
    assert.deepEqual(validateContact(body), { ok: false, error: "too_long", status: 413 }, label);
  }
});

test("tepat pada batas masih diterima", () => {
  const r = validateContact({ ...good, message: "x".repeat(MAX.message) });
  assert.equal(r.ok, true);
});

test("panjang diperiksa sebelum bentuk email", () => {
  // Payload raksasa yang juga bukan email: harus 413, bukan 400 — supaya
  // regex tidak pernah menyentuh megabyte kiriman.
  const r = validateContact({ ...good, message: "x".repeat(MAX.message + 1), email: "bukan-email" });
  assert.deepEqual(r, { ok: false, error: "too_long", status: 413 });
});

test("alamat email yang salah bentuk ditolak 400 email", () => {
  for (const bad of ["bukan-email", "a@b", "a b@c.co", "@b.co", "a@.co", "a@b.", "a@ b.co"]) {
    const r = validateContact({ ...good, email: bad });
    assert.deepEqual(r, { ok: false, error: "email", status: 400 }, bad);
  }
});

test("alamat email yang wajar diterima", () => {
  for (const ok of ["a@b.co", "randy.setiawan+tag@mail.example.com", "x_y-z@sub.domain.id"]) {
    assert.equal(validateContact({ ...good, email: ok }).ok, true, ok);
  }
});

test("token boleh kosong — Turnstile yang menolak, bukan validator", () => {
  const r = validateContact({ ...good, token: "" });
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.fields.token, "");
});
