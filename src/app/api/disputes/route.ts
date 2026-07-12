import { store, nextId } from "@/lib/datastore";
import { classifyModeration } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  return Response.json({ disputes: s.disputes });
}

// "Report Abuse" submission — creates dispute, runs it through the (dummy) moderation
// classifier that stands in for the Modal-hosted MiniCPM5-1B endpoint, and queues result.
export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { reporterAgentId, reportedAgentId, reason, evidence } = body as {
    reporterAgentId: number | null;
    reportedAgentId: number;
    reason: string;
    evidence?: Record<string, unknown>;
  };

  const dispute = {
    id: nextId("disputes"),
    reporterAgentId: reporterAgentId ?? null,
    reportedAgentId,
    reason,
    evidence: evidence ?? {},
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  s.disputes.push(dispute);

  // Feed both the reason and any free-text evidence to the (dummy) classifier so
  // richer abuse reports (e.g. pasted offending message) are detected, not just the reason tag.
  const evidenceText = typeof evidence?.text === "string" ? ` ${evidence.text}` : "";
  const { flagType, confidence } = classifyModeration(`${reason}${evidenceText}`);

  const queueItem = {
    id: nextId("moderationQueue"),
    agentId: reportedAgentId,
    flagType,
    aiConfidence: confidence,
    status: "pending",
    reviewedBy: null,
    createdAt: new Date().toISOString(),
  };
  s.moderationQueue.push(queueItem);

  return Response.json({ dispute, moderation: queueItem });
}
