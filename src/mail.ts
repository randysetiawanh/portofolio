/**
 * MIME assembly for the contact form. The Email Routing binding takes a raw
 * message, so it is built by hand. No cloudflare: import, so node --test can
 * reach it.
 */

/** CR and LF are what make header injection possible; strip them before any
 *  visitor-supplied value reaches a header line. */
export const headerSafe = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export function base64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export const encodeHeader = (v: string) =>
  /^[\x20-\x7E]*$/.test(v) ? v : `=?utf-8?B?${base64(v)}?=`;

export function buildMime(o: {
  from: string; to: string; replyName: string; replyTo: string; subject: string; body: string;
}): string {
  const domain = o.from.split("@")[1] ?? "localhost";
  return [
    `From: Website <${o.from}>`,
    `To: <${o.to}>`,
    `Reply-To: ${encodeHeader(o.replyName)} <${o.replyTo}>`,
    `Subject: ${encodeHeader(o.subject)}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64(o.body).replace(/(.{76})/g, "$1\r\n"),
  ].join("\r\n");
}
