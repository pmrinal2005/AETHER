import { store, nextId } from "@/lib/datastore";
import { warningStatusFromPct } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  return Response.json({ queue: s.moderationQueue });
}

// AI Moderator Buddy actions: Approve / Timeout / Revoke
export async function PATCH(req: Request) {
  const s = store();
  const body = await req.json();
  const { id, action, reviewedBy } = body as { id: number; action: "approved" | "timeout" | "revoked"; reviewedBy: string };

  const item = s.moderationQueue.find((m) => m.id === id);
  if (!item) return Response.json({ error: "not found" }, { status: 404 });

  item.status = action;
  item.reviewedBy = reviewedBy;

  if (action === "approved") {
    return Response.json({ ok: true });
  }

  // Timeout or Revoke increases the warning meter and cascades status.
  const warning = s.warningLevels.find((w) => w.agentId === item.agentId);
  const bump = action === "revoked" ? 45 : 20;
  const newPct = Math.min(100, (warning?.warningPct ?? 0) + bump);
  const newStatus = action === "revoked" ? "blocked" : warningStatusFromPct(newPct);

  if (warning) {
    warning.warningPct = newPct;
    warning.status = newStatus;
    warning.lastIncidentAt = new Date().toISOString();
  } else {
    s.warningLevels.push({ id: nextId("warningLevels"), agentId: item.agentId, warningPct: newPct, status: newStatus, lastIncidentAt: new Date().toISOString() });
  }

  const agentStatus = action === "revoked" ? "revoked" : newStatus === "blocked" ? "blocked" : "active";
  const agent = s.agents.find((a) => a.id === item.agentId);
  if (agent) agent.status = agentStatus;

  const broadcastStatus = action === "revoked" ? "revoked" : "suspended";
  const st = s.statusBroadcast.find((x) => x.agentId === item.agentId);
  if (st) {
    st.status = broadcastStatus;
    st.message = `Moderation action: ${action}`;
    st.updatedAt = new Date().toISOString();
  } else {
    s.statusBroadcast.push({ id: nextId("statusBroadcast"), agentId: item.agentId, status: broadcastStatus, message: `Moderation action: ${action}`, updatedAt: new Date().toISOString() });
  }

  s.disputes.filter((d) => d.reportedAgentId === item.agentId).forEach((d) => (d.status = "resolved"));

  if (action === "revoked") {
    s.revocationEvents.push({
      id: nextId("revocationEvents"),
      agentId: item.agentId,
      eventType: "revoked",
      payload: { reason: item.flagType, moderationQueueId: id, timestamp: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    });
  }

  return Response.json({ ok: true, newPct, newStatus });
}
