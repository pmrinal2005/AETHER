import { db } from "@/db";
import { agents, bootcampResults, scoresHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BOOTCAMP_PERSONAS, runBootcampRound, computeAgentScore } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { agentId } = (await req.json()) as { agentId: number };
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
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

  await db.insert(bootcampResults).values({ agentId, roundLogs, cooperationRate, bootstrapScore });
  await db.update(agents).set({ bootcampComplete: true }).where(eq(agents.id, agentId));

  const { score, breakdown } = computeAgentScore({
    cooperationRate,
    disputeCount: 0,
    credentialFreshnessDays: 1,
    uptimePct: 99,
    gossipAvg: 0.5,
    warningPct: 0,
  });
  await db.insert(scoresHistory).values({ agentId, score, scoreBreakdown: breakdown });

  return Response.json({ roundLogs, cooperationRate, bootstrapScore, finalScore: score });
}
