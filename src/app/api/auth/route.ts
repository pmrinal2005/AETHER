import { store } from "@/lib/datastore";
import { hashPassword, signSession, SESSION_COOKIE, getSession } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return Response.json({ session });
}

export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { action } = body as { action: "login" | "logout" };

  if (action === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return Response.json({ ok: true });
  }

  const { username, password } = body as { username: string; password: string };
  const op = s.operators.find((o) => o.username === username);
  if (!op || op.passwordHash !== hashPassword(password)) {
    return Response.json({ error: "Invalid screen name or password." }, { status: 401 });
  }
  const token = signSession({ username: op.username, role: op.role, id: op.id });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return Response.json({ ok: true, role: op.role, username: op.username });
}
