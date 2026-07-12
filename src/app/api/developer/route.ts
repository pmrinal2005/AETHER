import { store, nextId } from "@/lib/datastore";
import { randomKey, hashKey } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = store();
  const { searchParams } = new URL(req.url);
  const agentId = Number(searchParams.get("agentId"));
  return Response.json({
    apiKeys: s.apiKeys.filter((k) => k.agentId === agentId).map((k) => ({ ...k, keyHash: undefined })),
    credentials: s.credentials.filter((c) => c.agentId === agentId),
  });
}

export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { action, agentId } = body as { action: "create-key" | "revoke-key" | "rotate-credential"; agentId: number };

  if (action === "create-key") {
    const raw = randomKey("aim");
    const row = {
      id: nextId("apiKeys"),
      agentId,
      keyHash: hashKey(raw),
      keyPreview: raw.slice(0, 10) + "...",
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    s.apiKeys.push(row);
    return Response.json({ apiKey: { ...row, keyHash: undefined }, rawKey: raw });
  }

  if (action === "revoke-key") {
    const { id } = body as { id: number };
    const key = s.apiKeys.find((k) => k.id === id);
    if (key) key.revoked = true;
    return Response.json({ ok: true });
  }

  if (action === "rotate-credential") {
    const row = {
      id: nextId("credentials"),
      agentId,
      credentialType: "operator-kyb",
      credentialData: { verifiedBy: "self-attested-demo", rotated: true },
      verified: true,
      rotatedAt: new Date().toISOString(),
    };
    s.credentials.push(row);
    return Response.json({ credential: row });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
