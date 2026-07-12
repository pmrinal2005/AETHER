import { db } from "@/db";
import { reputationEdges } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(reputationEdges);
  return Response.json({ edges: rows });
}

// Adds/updates a direct interaction edge and propagates a smaller adjustment to
// existing gossip edges touching the same pair (second-order reputation propagation).
export async function POST(req: Request) {
  const body = await req.json();
  const { fromAgentId, toAgentId, edgeType, weightDelta } = body as {
    fromAgentId: number;
    toAgentId: number;
    edgeType: "direct" | "gossip";
    weightDelta: number;
  };

  const match = await db.select().from(reputationEdges).where(eq(reputationEdges.fromAgentId, fromAgentId));
  const target = match.find((m) => m.toAgentId === toAgentId && m.edgeType === edgeType);

  if (target) {
    const newWeight = Math.max(0, Math.min(1, target.weight + weightDelta));
    await db.update(reputationEdges).set({ weight: newWeight, updatedAt: new Date() }).where(eq(reputationEdges.id, target.id));
  } else {
    await db.insert(reputationEdges).values({
      fromAgentId,
      toAgentId,
      edgeType,
      weight: Math.max(0, Math.min(1, 0.5 + weightDelta)),
    });
  }

  // Gossip propagation: nudge other edges pointing at toAgentId a fraction of the delta.
  const gossipTargets = await db.select().from(reputationEdges).where(eq(reputationEdges.toAgentId, toAgentId));
  for (const g of gossipTargets) {
    if (g.edgeType !== "gossip") continue;
    const nudged = Math.max(0, Math.min(1, g.weight + weightDelta * 0.3));
    await db.update(reputationEdges).set({ weight: nudged, updatedAt: new Date() }).where(eq(reputationEdges.id, g.id));
  }

  return Response.json({ ok: true });
}
