/**
 * Cloudflare Access JWT verification.
 *
 * Access puts a signed JWT on every request that passes its policy. Trusting
 * the header's presence alone would be worthless — anyone can send a header.
 * So the signature is verified against the team's public keys, and the
 * audience, issuer and expiry are all checked.
 *
 * Fails closed: with no team domain or audience configured, nothing is ever
 * authorised. That is deliberate — it means the admin panel is shut until
 * Access is actually set up, rather than open by default.
 */

interface Jwk {
  kid: string;
  kty: string;
  alg?: string;
  n: string;
  e: string;
}

interface AccessClaims {
  aud: string[] | string;
  email?: string;
  exp: number;
  iss: string;
  nbf?: number;
}

/** Cached per isolate; Access rotates keys infrequently. */
let keyCache: { team: string; at: number; keys: Map<string, CryptoKey> } | null = null;
const KEY_TTL_MS = 60 * 60 * 1000;

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlToString(s: string): string {
  return new TextDecoder().decode(b64urlToBytes(s));
}

async function loadKeys(team: string): Promise<Map<string, CryptoKey>> {
  const fresh = keyCache && keyCache.team === team && Date.now() - keyCache.at < KEY_TTL_MS;
  if (fresh) return keyCache!.keys;

  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`access certs ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };

  const keys = new Map<string, CryptoKey>();
  for (const jwk of body.keys ?? []) {
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    keys.set(jwk.kid, key);
  }
  keyCache = { team, at: Date.now(), keys };
  return keys;
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

/**
 * @returns the verified email, or null when the request is not authorised.
 */
export async function verifyAccess(
  request: Request,
  teamDomain: string | undefined,
  audience: string | undefined,
): Promise<string | null> {
  const team = teamDomain?.trim();
  const aud = audience?.trim();
  if (!team || !aud) return null; // not configured -> nobody gets in

  const token =
    request.headers.get("cf-access-jwt-assertion") ??
    readCookie(request, "CF_Authorization");
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [rawHeader, rawPayload, rawSig] = parts;

  let header: { kid?: string; alg?: string };
  let claims: AccessClaims;
  try {
    header = JSON.parse(b64urlToString(rawHeader));
    claims = JSON.parse(b64urlToString(rawPayload));
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid) return null;

  let keys: Map<string, CryptoKey>;
  try {
    keys = await loadKeys(team);
  } catch {
    return null;
  }
  const key = keys.get(header.kid);
  if (!key) return null;

  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(rawSig),
    new TextEncoder().encode(`${rawHeader}.${rawPayload}`),
  );
  if (!ok) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now) return null;
  if (typeof claims.nbf === "number" && claims.nbf > now + 60) return null;
  if (claims.iss !== `https://${team}`) return null;

  const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!auds.includes(aud)) return null;

  return claims.email ?? "authorised";
}
