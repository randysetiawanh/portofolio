/**
 * Contact form validation, split out of the request handler so the rules can be
 * tested without a Request, a Worker or a network.
 *
 * Every rejection carries its own code and status: the form tells the visitor
 * what went wrong rather than failing as one anonymous error.
 */

export const MAX = { name: 100, email: 254, message: 5000 } as const;

export interface ContactFields {
  name: string;
  email: string;
  message: string;
  token: string;
}

export type ContactCheck =
  | { ok: true; fields: ContactFields }
  | { ok: false; error: string; status: number };

/** Order matters. Length is checked before the address shape so a megabyte of
 *  text is rejected on size, not walked through a regex first. */
export function validateContact(body: Record<string, unknown>): ContactCheck {
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const token = String(body.token ?? "");

  if (!name || !email || !message) return { ok: false, error: "incomplete", status: 400 };
  if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
    return { ok: false, error: "too_long", status: 413 };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "email", status: 400 };

  return { ok: true, fields: { name, email, message, token } };
}
