import { db } from "@/db";
import { apiKeys, credentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomKey, hashKey } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = Number(searchParams.get("agentId"));
  const [keys, creds] = await Promise.all([
    db.select().from(apiKeys).where(eq(apiKeys.agentId, agentId)),
    db.select().from(credentials).where(eq(credentials.agentId, agentId)),
  ]);
  return Response.json({ apiKeys: keys.map((k) => ({ ...k, keyHash: undefined })), credentials: creds });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action, agentId } = body as { action: "create-key" | "revoke-key" | "rotate-credential"; agentId: number };

  if (action === "create-key") {
    const raw = randomKey("aim");
    const [row] = await db
      .insert(apiKeys)
      .values({ agentId, keyHash: hashKey(raw), keyPreview: raw.slice(0, 10) + "..." })
      .returning();
    return Response.json({ apiKey: { ...row, keyHash: undefined }, rawKey: raw });
  }

  if (action === "revoke-key") {
    const { id } = body as { id: number };
    await db.update(apiKeys).set({ revoked: true }).where(eq(apiKeys.id, id));
    return Response.json({ ok: true });
  }

  if (action === "rotate-credential") {
    const [row] = await db
      .insert(credentials)
      .values({ agentId, credentialType: "operator-kyb", credentialData: { verifiedBy: "self-attested-demo", rotated: true }, verified: true })
      .returning();
    return Response.json({ credential: row });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
