import { store } from "@/lib/datastore";

export const dynamic = "force-dynamic";

// Public "AIM Verified" badge API — used by the embeddable widget and Trust Query API.
export async function GET(_req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const s = store();
  const { agentId } = await params;
  const id = Number(agentId);
  const agent = s.agents.find((a) => a.id === id);
  if (!agent) return Response.json({ error: "not found" }, { status: 404 });
  const score = [...s.scoresHistory.filter((r) => r.agentId === id)].sort(
    (a, b) => new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime()
  )[0];
  const warning = s.warningLevels.find((w) => w.agentId === id);

  return Response.json({
    did: agent.did,
    screenName: agent.screenName,
    status: agent.status,
    trustScore: score?.score ?? null,
    trustTier: warning?.status ?? "unknown",
    verified: agent.status === "active" && (score?.score ?? 0) >= 400,
    badgeText: agent.status === "active" ? "AIM Verified" : "Not Verified",
    checkedAt: new Date().toISOString(),
  });
}
