/**
 * Head rendering, kept free of any cloudflare: import so it can be exercised
 * by node --test. Crawlers do not run scripts, so this is real markup.
 */

/** Attribute-safe. Content is authored in /admin, so an unescaped quote here
 *  would end the attribute and put the rest of the string into the markup. */
export function attr(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface Seo {
  title?: string; description?: string; url?: string;
  ogTitle?: string; ogDescription?: string; image?: string;
}

/** Title, description and the link-preview card. Several crawlers reject
 *  relative image URLs outright, so every URL is made absolute. */
export function seoBlock(seo: Seo | undefined, fallback: string): string {
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
