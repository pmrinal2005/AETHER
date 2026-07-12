import { computeAgentScore } from "@/lib/core";

export const dynamic = "force-dynamic";

// Public demo endpoint standing in for the Modal-hosted XGBoost/ONNX AgentScore
// serving function. Trained on a synthetic Claude-generated dataset in the full spec;
// here it's a transparent deterministic formula over the same feature set for demo speed.
export async function POST(req: Request) {
  const body = await req.json();
  const result = computeAgentScore({
    cooperationRate: Number(body.cooperationRate ?? 0.5),
    disputeCount: Number(body.disputeCount ?? 0),
    credentialFreshnessDays: Number(body.credentialFreshnessDays ?? 0),
    uptimePct: Number(body.uptimePct ?? 99),
    gossipAvg: Number(body.gossipAvg ?? 0.5),
    warningPct: Number(body.warningPct ?? 0),
  });
  return Response.json(result);
}
