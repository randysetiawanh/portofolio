/**
 * Content store.
 *
 * Documents live in D1 as JSON blobs keyed by section. They are always read
 * and written whole, so a relational schema would only add join tables for no
 * benefit — see migrations/0001_init.sql.
 */

export const SECTIONS = [
  "domains", "projects", "layers", "timeline", "i18n",
  "identity", "stats", "credentials", "contact", "footer",
  "services", "practice", "appearance", "seo",
] as const;
export type Section = (typeof SECTIONS)[number];

export interface ContentDoc {
  [key: string]: unknown;
}

/** Per-isolate cache. Short enough that an edit shows up almost at once,
 *  long enough to absorb a burst of page views on one D1 read. */
let cache: { at: number; version: string; data: Record<string, unknown> } | null = null;
const TTL_MS = 10_000;

export async function readAll(
  db: D1Database,
  force = false,
): Promise<{ version: string; data: Record<string, unknown> }> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return { version: cache.version, data: cache.data };
  }

  const [rows, ver] = await Promise.all([
    db.prepare("SELECT key, value FROM content").all<{ key: string; value: string }>(),
    db.prepare("SELECT value FROM meta WHERE key = 'version'").first<{ value: string }>(),
  ]);

  const data: Record<string, unknown> = {};
  for (const row of rows.results ?? []) {
    try {
      data[row.key] = JSON.parse(row.value);
    } catch {
      // A malformed row must not take the whole page down.
      data[row.key] = null;
    }
  }
  const version = ver?.value ?? "1";
  cache = { at: Date.now(), version, data };
  return { version, data };
}

export async function writeSection(
  db: D1Database,
  key: Section,
  value: unknown,
): Promise<void> {
  const json = JSON.stringify(value);
  await db.batch([
    db
      .prepare("INSERT OR REPLACE INTO content (key, value, updated_at) VALUES (?, ?, ?)")
      .bind(key, json, Math.floor(Date.now() / 1000)),
    db.prepare(
      "UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'version'",
    ),
  ]);
  cache = null;
}

export function bustCache(): void {
  cache = null;
}

/** Media keys are user-supplied; keep them to a safe, predictable shape. */
export function safeMediaKey(folder: string, name: string): string | null {
  const f = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!["logo", "porto", "img", "cv"].includes(f)) return null;
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  if (!base || base.includes("..")) return null;
  return `${f}/${base}`;
}
