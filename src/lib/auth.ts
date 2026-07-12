import crypto from "node:crypto";
import { cookies } from "next/headers";
import { hashPassword as coreHashPassword } from "./core";

const SESSION_SECRET = process.env.SESSION_SECRET || "aim-demo-session-secret";
export const SESSION_COOKIE = "aim_session";

export function hashPassword(password: string): string {
  return coreHashPassword(password);
}

export function signSession(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
