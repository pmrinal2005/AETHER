import { store, nextId } from "@/lib/datastore";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  return Response.json({ edges: s.reputationEdges });
}

// Adds/updates a direct interaction edge and propagates a smaller adjustment to
// existing gossip edges touching the same pair (second-order reputation propagation).
export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { fromAgentId, toAgentId, edgeType, weightDelta } = body as {
    fromAgentId: number;
    toAgentId: number;
    edgeType: "direct" | "gossip";
    weightDelta: number;
  };

  const target = s.reputationEdges.find((m) => m.fromAgentId === fromAgentId && m.toAgentId === toAgentId && m.edgeType === edgeType);

  if (target) {
    target.weight = Math.max(0, Math.min(1, target.weight + weightDelta));
    target.updatedAt = new Date().toISOString();
  } else {
    s.reputationEdges.push({
      id: nextId("reputationEdges"),
      fromAgentId,
      toAgentId,
      edgeType,
      weight: Math.max(0, Math.min(1, 0.5 + weightDelta)),
      updatedAt: new Date().toISOString(),
    });
  }

  // Gossip propagation: nudge other gossip edges pointing at toAgentId a fraction of the delta.
  s.reputationEdges
    .filter((g) => g.toAgentId === toAgentId && g.edgeType === "gossip")
    .forEach((g) => {
      g.weight = Math.max(0, Math.min(1, g.weight + weightDelta * 0.3));
      g.updatedAt = new Date().toISOString();
    });

  return Response.json({ ok: true });
}
