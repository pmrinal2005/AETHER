import { db } from "@/db";
import { federationPeers, federationSyncLog, scoresHistory, agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { signAttestation, verifyAttestation } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const [peers, logs] = await Promise.all([
    db.select().from(federationPeers),
    db.select().from(federationSyncLog).orderBy(desc(federationSyncLog.createdAt)).limit(30),
  ]);
  return Response.json({ peers, logs });
}

// TrustFederation Protocol (Feature #22): outbound push + inbound verify against a
// signed attestation payload {agent_id, score_delta, signature, timestamp}. The "mock
// external registry" peer is simulated in-process (self-referential verify) since this
// sandbox cannot stand up a second public deployment.
export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body as { action: "add-peer" | "sync" | "inbound" };

  if (action === "add-peer") {
    const { registryName, endpointUrl } = body as { registryName: string; endpointUrl: string };
    const [peer] = await db
      .insert(federationPeers)
      .values({ registryName, endpointUrl, publicKey: "demo-pubkey-" + Math.random().toString(36).slice(2, 10) })
      .returning();
    return Response.json({ peer });
  }

  if (action === "sync") {
    const { peerId, agentId } = body as { peerId: number; agentId: number };
    const [latest] = await db.select().from(scoresHistory).where(eq(scoresHistory.agentId, agentId)).orderBy(desc(scoresHistory.computedAt)).limit(1);
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
    const payload = {
      agent_id: agent?.did ?? String(agentId),
      score_delta: latest?.score ?? 0,
      timestamp: new Date().toISOString(),
    };
    const signature = signAttestation(payload);
    const [log] = await db.insert(federationSyncLog).values({ peerId, direction: "outbound", payload: { ...payload, signature }, signatureValid: true }).returning();
    await db.update(federationPeers).set({ lastSyncedAt: new Date() }).where(eq(federationPeers.id, peerId));
    return Response.json({ log, payload, signature });
  }

  if (action === "inbound") {
    const { peerId, payload, signature } = body as { peerId: number; payload: Record<string, unknown>; signature: string };
    const valid = verifyAttestation(payload, signature);
    const [log] = await db.insert(federationSyncLog).values({ peerId, direction: "inbound", payload, signatureValid: valid }).returning();
    return Response.json({ log, valid });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
