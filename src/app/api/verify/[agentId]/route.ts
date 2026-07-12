import { db } from "@/db";
import { agents, scoresHistory, warningLevels } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Public "AIM Verified" badge API — used by the embeddable widget and Trust Query API.
export async function GET(_req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const id = Number(agentId);
  const [agent] = await db.select().from(agents).where(eq(agents.id, id));
  if (!agent) return Response.json({ error: "not found" }, { status: 404 });
  const [score] = await db.select().from(scoresHistory).where(eq(scoresHistory.agentId, id)).orderBy(desc(scoresHistory.computedAt)).limit(1);
  const [warning] = await db.select().from(warningLevels).where(eq(warningLevels.agentId, id));

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
