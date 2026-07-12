import { db } from "@/db";
import { moderationQueue, warningLevels, agents, statusBroadcast, revocationEvents, disputes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { warningStatusFromPct } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(moderationQueue);
  return Response.json({ queue: rows });
}

// AI Moderator Buddy actions: Approve / Timeout / Revoke
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, action, reviewedBy } = body as { id: number; action: "approved" | "timeout" | "revoked"; reviewedBy: string };

  const [item] = await db.select().from(moderationQueue).where(eq(moderationQueue.id, id));
  if (!item) return Response.json({ error: "not found" }, { status: 404 });

  await db.update(moderationQueue).set({ status: action, reviewedBy }).where(eq(moderationQueue.id, id));

  if (action === "approved") {
    return Response.json({ ok: true });
  }

  // Timeout or Revoke increases the warning meter and cascades status.
  const [warning] = await db.select().from(warningLevels).where(eq(warningLevels.agentId, item.agentId));
  const bump = action === "revoked" ? 45 : 20;
  const newPct = Math.min(100, (warning?.warningPct ?? 0) + bump);
  const newStatus = action === "revoked" ? "blocked" : warningStatusFromPct(newPct);

  if (warning) {
    await db
      .update(warningLevels)
      .set({ warningPct: newPct, status: newStatus, lastIncidentAt: new Date() })
      .where(eq(warningLevels.agentId, item.agentId));
  } else {
    await db.insert(warningLevels).values({ agentId: item.agentId, warningPct: newPct, status: newStatus, lastIncidentAt: new Date() });
  }

  const agentStatus = action === "revoked" ? "revoked" : newStatus === "blocked" ? "blocked" : "active";
  await db.update(agents).set({ status: agentStatus }).where(eq(agents.id, item.agentId));

  await db
    .insert(statusBroadcast)
    .values({ agentId: item.agentId, status: action === "revoked" ? "revoked" : "suspended", message: `Moderation action: ${action}` })
    .onConflictDoUpdate({
      target: statusBroadcast.agentId,
      set: { status: action === "revoked" ? "revoked" : "suspended", message: `Moderation action: ${action}`, updatedAt: new Date() },
    });

  await db.update(disputes).set({ status: "resolved" }).where(eq(disputes.reportedAgentId, item.agentId));

  if (action === "revoked") {
    await db.insert(revocationEvents).values({
      agentId: item.agentId,
      eventType: "revoked",
      payload: { reason: item.flagType, moderationQueueId: id, timestamp: new Date().toISOString() },
    });
  }

  return Response.json({ ok: true, newPct, newStatus });
}
