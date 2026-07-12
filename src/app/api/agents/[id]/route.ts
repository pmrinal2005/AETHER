import { db } from "@/db";
import {
  agents,
  passports,
  credentials,
  scoresHistory,
  disputes,
  moderationQueue,
  delegationGraph,
  warningLevels,
  statusBroadcast,
  bootcampResults,
  revocationEvents,
} from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agentId = Number(id);
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
  if (!agent) return Response.json({ error: "not found" }, { status: 404 });

  const [passportRows, credRows, scoreRows, disputeRows, modRows, delegRows, warningRows, statusRows, bootcampRows] = await Promise.all([
    db.select().from(passports).where(eq(passports.agentId, agentId)),
    db.select().from(credentials).where(eq(credentials.agentId, agentId)),
    db.select().from(scoresHistory).where(eq(scoresHistory.agentId, agentId)).orderBy(desc(scoresHistory.computedAt)),
    db.select().from(disputes).where(or(eq(disputes.reportedAgentId, agentId), eq(disputes.reporterAgentId, agentId))),
    db.select().from(moderationQueue).where(eq(moderationQueue.agentId, agentId)),
    db.select().from(delegationGraph).where(or(eq(delegationGraph.parentAgentId, agentId), eq(delegationGraph.subAgentId, agentId))),
    db.select().from(warningLevels).where(eq(warningLevels.agentId, agentId)),
    db.select().from(statusBroadcast).where(eq(statusBroadcast.agentId, agentId)),
    db.select().from(bootcampResults).where(eq(bootcampResults.agentId, agentId)),
  ]);

  return Response.json({
    agent,
    passports: passportRows,
    credentials: credRows,
    scoresHistory: scoreRows,
    disputes: disputeRows,
    moderationQueue: modRows,
    delegations: delegRows,
    warningLevel: warningRows[0] ?? null,
    status: statusRows[0] ?? null,
    bootcamp: bootcampRows[0] ?? null,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agentId = Number(id);
  const body = await req.json();
  const { action } = body as { action: "revoke" | "suspend" | "activate" };

  const newStatus = action === "revoke" ? "revoked" : action === "suspend" ? "suspended" : "active";
  await db.update(agents).set({ status: newStatus }).where(eq(agents.id, agentId));
  await db
    .insert(statusBroadcast)
    .values({ agentId, status: newStatus, message: action === "revoke" ? "Deauthorized by AIM Moderation." : "" })
    .onConflictDoUpdate({
      target: statusBroadcast.agentId,
      set: { status: newStatus, message: action === "revoke" ? "Deauthorized by AIM Moderation." : "", updatedAt: new Date() },
    });

  if (action === "revoke") {
    await db.insert(revocationEvents).values({
      agentId,
      eventType: "revoked",
      payload: { reason: "manual-revoke", timestamp: new Date().toISOString() },
    });
  }

  return Response.json({ ok: true, status: newStatus });
}
