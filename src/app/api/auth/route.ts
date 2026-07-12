import { db } from "@/db";
import { operators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signSession, SESSION_COOKIE, getSession } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return Response.json({ session });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body as { action: "login" | "logout" };

  if (action === "logout") {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    return Response.json({ ok: true });
  }

  const { username, password } = body as { username: string; password: string };
  const [op] = await db.select().from(operators).where(eq(operators.username, username));
  if (!op || op.passwordHash !== hashPassword(password)) {
    return Response.json({ error: "Invalid screen name or password." }, { status: 401 });
  }
  const token = signSession({ username: op.username, role: op.role, id: op.id });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return Response.json({ ok: true, role: op.role, username: op.username });
}
