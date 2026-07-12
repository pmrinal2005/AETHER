import { db } from "@/db";
import { disputes, moderationQueue } from "@/db/schema";
import { classifyModeration } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(disputes);
  return Response.json({ disputes: rows });
}

// "Report Abuse" submission — creates dispute, runs it through the (dummy) moderation
// classifier that stands in for the Modal-hosted MiniCPM5-1B endpoint, and queues result.
export async function POST(req: Request) {
  const body = await req.json();
  const { reporterAgentId, reportedAgentId, reason, evidence } = body as {
    reporterAgentId: number | null;
    reportedAgentId: number;
    reason: string;
    evidence?: Record<string, unknown>;
  };

  const [dispute] = await db
    .insert(disputes)
    .values({ reporterAgentId: reporterAgentId ?? null, reportedAgentId, reason, evidence: evidence ?? {}, status: "pending" })
    .returning();

  const { flagType, confidence } = classifyModeration(reason);

  const [queueItem] = await db
    .insert(moderationQueue)
    .values({ agentId: reportedAgentId, flagType, aiConfidence: confidence, status: "pending" })
    .returning();

  return Response.json({ dispute, moderation: queueItem });
}
