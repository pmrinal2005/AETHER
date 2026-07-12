import { store, nextId } from "@/lib/datastore";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = store();
  const { id } = await params;
  const agentId = Number(id);
  const agent = s.agents.find((a) => a.id === agentId);
  if (!agent) return Response.json({ error: "not found" }, { status: 404 });

  const byNewest = <T extends { computedAt?: string }>(arr: T[]) =>
    [...arr].sort((a, b) => new Date(b.computedAt ?? 0).getTime() - new Date(a.computedAt ?? 0).getTime());

  return Response.json({
    agent,
    passports: s.passports.filter((p) => p.agentId === agentId),
    credentials: s.credentials.filter((c) => c.agentId === agentId),
    scoresHistory: byNewest(s.scoresHistory.filter((r) => r.agentId === agentId)),
    disputes: s.disputes.filter((d) => d.reportedAgentId === agentId || d.reporterAgentId === agentId),
    moderationQueue: s.moderationQueue.filter((m) => m.agentId === agentId),
    delegations: s.delegationGraph.filter((d) => d.parentAgentId === agentId || d.subAgentId === agentId),
    warningLevel: s.warningLevels.find((w) => w.agentId === agentId) ?? null,
    status: s.statusBroadcast.find((st) => st.agentId === agentId) ?? null,
    bootcamp: s.bootcampResults.find((b) => b.agentId === agentId) ?? null,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = store();
  const { id } = await params;
  const agentId = Number(id);
  const body = await req.json();
  const { action } = body as { action: "revoke" | "suspend" | "activate" };

  const newStatus = action === "revoke" ? "revoked" : action === "suspend" ? "suspended" : "active";
  const agent = s.agents.find((a) => a.id === agentId);
  if (agent) agent.status = newStatus;

  const st = s.statusBroadcast.find((x) => x.agentId === agentId);
  const message = action === "revoke" ? "Deauthorized by AIM Moderation." : "";
  if (st) {
    st.status = newStatus;
    st.message = message;
    st.updatedAt = new Date().toISOString();
  } else {
    s.statusBroadcast.push({ id: nextId("statusBroadcast"), agentId, status: newStatus, message, updatedAt: new Date().toISOString() });
  }

  if (action === "revoke") {
    s.revocationEvents.push({
      id: nextId("revocationEvents"),
      agentId,
      eventType: "revoked",
      payload: { reason: "manual-revoke", timestamp: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    });
  }

  return Response.json({ ok: true, status: newStatus });
}
