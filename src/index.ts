/**
 * randysetiawan portfolio — Cloudflare Worker.
 *
 * The page shell (markup, CSS, fonts) stays a static asset. Content lives in
 * D1 and is injected into the shell at request time, so editing text never
 * needs a deploy. Media lives in R2 and is served from /m/*.
 *
 * /admin and every /api/admin route sit behind Cloudflare Access. The JWT is
 * verified properly (see access.ts) and the check fails closed, so until
 * Access is configured nobody can reach the editor at all.
 */
import { DurableObject } from "cloudflare:workers";
import { EmailMessage } from "cloudflare:email";
import { verifyAccess } from "./access";
import { readAll, writeSection, bustCache, safeMediaKey, SECTIONS, type Section } from "./content";
import { ADMIN_HTML } from "./admin-ui";
import { pageStyle, swatchStyle, PATTERNS } from "./patterns";

interface Env {
  ASSETS: Fetcher;
  COUNTER: DurableObjectNamespace<ViewCounter>;
  CONTENT: D1Database;
  MEDIA: R2Bucket;
  MAILER?: { send(message: EmailMessage): Promise<void> };
  TURNSTILE_SECRET?: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}

const MAX = { name: 100, email: 254, message: 5000 } as const;
const MAX_UPLOAD = 15 * 1024 * 1024;

/* ── view counter ─────────────────────────────────────────────────────── */
export class ViewCounter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS hits (id INTEGER PRIMARY KEY, n INTEGER NOT NULL)",
    );
    ctx.storage.sql.exec("INSERT OR IGNORE INTO hits (id, n) VALUES (1, 0)");
  }
  bump(): number {
    this.ctx.storage.sql.exec("UPDATE hits SET n = n + 1 WHERE id = 1");
    return this.read();
  }
  read(): number {
    return Number(
      this.ctx.storage.sql.exec<{ n: number }>("SELECT n FROM hits WHERE id = 1").one().n,
    );
  }
}

/* ── helpers ──────────────────────────────────────────────────────────── */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

const headerSafe = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

function base64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
const encodeHeader = (v: string) => (/^[\x20-\x7E]*$/.test(v) ? v : `=?utf-8?B?${base64(v)}?=`);

function buildMime(o: {
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

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: form,
  });
  if (!res.ok) return false;
  return ((await res.json()) as { success?: boolean }).success === true;
}

/* ── public page: shell + injected content ────────────────────────────── */
const SLOT = "<!--content-slot-->";
const SEO_START = "<!--seo-start-->";
const SEO_END = "<!--seo-end-->";
let shellCache: string | null = null;

/** Attribute-safe. Content is authored in /admin, so an unescaped quote here
 *  would end the attribute and put the rest of the string into the markup. */
function attr(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface Seo {
  title?: string; description?: string; url?: string;
  ogTitle?: string; ogDescription?: string; image?: string;
}

/** Title, description and the link-preview card. Crawlers do not run scripts
 *  and several reject relative image URLs outright, so this is rendered as
 *  real markup and every URL is made absolute. */
function seoBlock(seo: Seo | undefined, fallback: string): string {
  if (!seo?.title) return fallback;
  const site = (seo.url || "https://rancores.space/").replace(/\/+$/, "") + "/";
  let img = seo.image || "";
  if (img && !/^https?:\/\//i.test(img)) img = site + img.replace(/^\/+/, "");

  const desc = seo.description ?? "";
  return [
    `<title>${attr(seo.title)}</title>`,
    `<meta name="description" content="${attr(desc)}">`,
    `<link rel="canonical" href="${attr(site)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${attr(site)}">`,
    `<meta property="og:title" content="${attr(seo.ogTitle || seo.title)}">`,
    `<meta property="og:description" content="${attr(seo.ogDescription || desc)}">`,
    img ? `<meta property="og:image" content="${attr(img)}">` : "",
    `<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}">`,
  ].join("\n");
}

async function renderPage(request: Request, env: Env): Promise<Response> {
  if (shellCache === null) {
    const res = await env.ASSETS.fetch(new URL("/index.html", request.url));
    if (!res.ok) return res;
    shellCache = await res.text();
  }
  const { version, data } = await readAll(env.CONTENT);

  // `<` is escaped so a `</script>` inside any content string cannot close
  // the tag early and inject markup.
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");

  // A dedicated marker, not a script-tag pattern: several scripts now open
  // the same way, and String.replace would silently take the wrong one.
  if (!shellCache.includes(SLOT)) {
    console.error("content slot missing from shell — serving without content");
    return new Response(shellCache, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  // Everything the first paint needs, injected together at the slot in <head>:
  // the content, the pattern stylesheet, and the attribute that selects one.
  // Running here rather than in the page script means no flash of the default.
  const bg = (data.appearance as { background?: string } | undefined)?.background ?? "grid";
  const safeBg = PATTERNS.some((p) => p.id === bg) ? bg : "grid";
  let html = shellCache.replace(
    SLOT,
    `<script>window.__CONTENT__=${payload};</script>` +
      `<style>${pageStyle()}</style>` +
      `<script>document.documentElement.setAttribute("data-bg",${JSON.stringify(safeBg)})</script>`,
  );

  // Swap the fallback head block for the edited one. Missing markers are not
  // fatal: the shell's own tags stay, which is the same thing they contain.
  const a = html.indexOf(SEO_START);
  const b = html.indexOf(SEO_END);
  if (a !== -1 && b > a) {
    const inner = html.slice(a + SEO_START.length, b);
    html = html.slice(0, a + SEO_START.length) +
      "\n" + seoBlock(data.seo as Seo | undefined, inner.trim()) + "\n" +
      html.slice(b);
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "x-content-version": version,
    },
  });
}

/* ── media ────────────────────────────────────────────────────────────── */
async function serveMedia(request: Request, env: Env, key: string): Promise<Response> {
  const obj = await env.MEDIA.get(key);
  if (!obj) return text("Not found", 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=300");
  if (request.headers.get("if-none-match") === obj.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(obj.body, { headers });
}

/* ── admin API ────────────────────────────────────────────────────────── */
async function handleAdminApi(
  request: Request, env: Env, url: URL, email: string,
): Promise<Response> {
  const path = url.pathname.replace("/api/admin", "");

  if (path === "/state" && request.method === "GET") {
    const [{ data }, media] = await Promise.all([
      readAll(env.CONTENT, true),
      env.CONTENT.prepare(
        "SELECT key, name, type, size, uploaded_at FROM media ORDER BY key",
      ).all(),
    ]);
    return json({ email, content: data, media: media.results ?? [] });
  }

  if (path.startsWith("/section/") && request.method === "PUT") {
    const key = path.slice("/section/".length) as Section;
    if (!SECTIONS.includes(key)) return text("Unknown section", 400);
    let value: unknown;
    try {
      value = await request.json();
    } catch {
      return text("Body is not valid JSON", 400);
    }
    await writeSection(env.CONTENT, key, value);
    return json({ ok: true });
  }

  if (path === "/media" && request.method === "POST") {
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "img");
    if (!(file instanceof File)) return text("No file", 400);
    if (file.size > MAX_UPLOAD) return text("File larger than 15 MB", 413);

    const key = safeMediaKey(folder, file.name);
    if (!key) return text("Bad folder or filename", 400);

    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    await env.CONTENT.prepare(
      "INSERT OR REPLACE INTO media (key, name, type, size, uploaded_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(key, file.name, file.type || "application/octet-stream", file.size,
           Math.floor(Date.now() / 1000)).run();
    return json({ ok: true, key, path: `/m/${key}` });
  }

  if (path === "/media" && request.method === "DELETE") {
    const key = url.searchParams.get("key");
    if (!key) return text("Missing key", 400);
    await env.MEDIA.delete(key);
    await env.CONTENT.prepare("DELETE FROM media WHERE key = ?").bind(key).run();
    bustCache();
    return json({ ok: true });
  }

  return text("Not found", 404);
}

/* ── public API ───────────────────────────────────────────────────────── */
async function handleViews(request: Request, env: Env): Promise<Response> {
  const stub = env.COUNTER.get(env.COUNTER.idFromName("site"));
  const count = request.method === "POST" ? await stub.bump() : await stub.read();
  return json({ count });
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "malformed" }, 400);
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const token = String(body.token ?? "");

  if (!name || !email || !message) return json({ error: "incomplete" }, 400);
  if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
    return json({ error: "too_long" }, 413);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email" }, 400);

  if (!env.TURNSTILE_SECRET) return json({ error: "unconfigured" }, 503);
  const ok = await verifyTurnstile(
    env.TURNSTILE_SECRET, token, request.headers.get("cf-connecting-ip"),
  );
  if (!ok) return json({ error: "bot_check" }, 403);
  if (!env.MAILER) return json({ error: "mail_unconfigured" }, 503);

  const raw = buildMime({
    from: env.CONTACT_FROM,
    to: env.CONTACT_TO,
    replyName: headerSafe(name),
    replyTo: headerSafe(email),
    subject: `Portfolio enquiry — ${headerSafe(name)}`,
    body: [`Name:  ${name}`, `Email: ${email}`, "", message, "", "— sent from rancores.space"].join("\n"),
  });

  try {
    await env.MAILER.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (err) {
    console.error("contact send failed", err);
    return json({ error: "send_failed" }, 502);
  }
  return json({ ok: true });
}

/* ── router ───────────────────────────────────────────────────────────── */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // One canonical hostname. www is attached to this Worker so the name
    // resolves at all — without a record it fails as ERR_NAME_NOT_RESOLVED —
    // but it redirects to the apex, which is what the canonical tag, the
    // sitemap and the Access application all refer to.
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    const { pathname } = url;

    if (pathname === "/m" || pathname.startsWith("/m/")) {
      return serveMedia(request, env, pathname.slice(3));
    }

    if (pathname === "/admin" || pathname === "/admin/" || pathname.startsWith("/api/admin")) {
      const who = await verifyAccess(request, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
      if (!who) {
        const configured = Boolean(env.ACCESS_TEAM_DOMAIN?.trim() && env.ACCESS_AUD?.trim());
        return text(
          configured
            ? "Not authorised."
            : "Admin is closed: Cloudflare Access is not configured yet.",
          configured ? 403 : 503,
        );
      }
      if (pathname.startsWith("/api/admin")) return handleAdminApi(request, env, url, who);
      const adminPage = ADMIN_HTML
        .replace("/*__SWATCH_CSS__*/", swatchStyle())
        .replace("/*__PATTERN_DATA__*/", "window.__PATTERNS__=" + JSON.stringify(
          PATTERNS.map((p) => ({ id: p.id, label: p.label, note: p.note })),
        ) + ";");
      return new Response(adminPage, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }

    if (pathname === "/api/views") return handleViews(request, env);
    if (pathname === "/api/contact") return handleContact(request, env);
    if (pathname === "/api/content") {
      const { data, version } = await readAll(env.CONTENT);
      return json({ version, ...data });
    }
    if (pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);

    if (pathname === "/") return renderPage(request, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
