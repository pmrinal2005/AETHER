import { store, nextId } from "@/lib/datastore";
import { BOOTCAMP_PERSONAS, runBootcampRound, computeAgentScore } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const s = store();
  const { agentId } = (await req.json()) as { agentId: number };
  const agent = s.agents.find((a) => a.id === agentId);
  if (!agent) return Response.json({ error: "not found" }, { status: 404 });

  const roundLogs: Record<string, unknown>[] = [];
  let totalCoop = 0;
  let totalRounds = 0;

  for (const persona of BOOTCAMP_PERSONAS) {
    let candidateLast: "cooperate" | "defect" | null = null;
    for (let round = 0; round < 6; round++) {
      const { personaMove, candidateMove } = runBootcampRound(persona.strategy, candidateLast, round);
      candidateLast = candidateMove;
      totalRounds += 1;
      if (candidateMove === "cooperate") totalCoop += 1;
      roundLogs.push({ persona: persona.label, round, personaMove, candidateMove });
    }
  }

  const cooperationRate = totalCoop / totalRounds;
  const bootstrapScore = Math.round(300 + cooperationRate * 600);

  s.bootcampResults.push({
    id: nextId("bootcampResults"),
    agentId,
    roundLogs,
    cooperationRate,
    bootstrapScore,
    createdAt: new Date().toISOString(),
  });
  agent.bootcampComplete = true;

  const { score, breakdown } = computeAgentScore({
    cooperationRate,
    disputeCount: 0,
    credentialFreshnessDays: 1,
    uptimePct: 99,
    gossipAvg: 0.5,
    warningPct: 0,
  });
  s.scoresHistory.push({ id: nextId("scoresHistory"), agentId, score, scoreBreakdown: breakdown, computedAt: new Date().toISOString() });

  return Response.json({ roundLogs, cooperationRate, bootstrapScore, finalScore: score });
}
