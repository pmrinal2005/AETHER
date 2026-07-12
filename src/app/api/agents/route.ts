import { db } from "@/db";
import { agents, passports, credentials, warningLevels, statusBroadcast, scoresHistory } from "@/db/schema";
import { generateDid, issuePassportBundle, normalizeDescriptor, computeAgentScore } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(agents);
  return Response.json({ agents: rows });
}

// Registration wizard final step: normalize descriptor -> create agent -> issue passport
// -> generate buddy icon seed -> initialize warning/status rows -> bootstrap score row.
export async function POST(req: Request) {
  const body = await req.json();
  const { protocolType, descriptor } = body as { protocolType: string; descriptor: unknown };
  const normalized = normalizeDescriptor(protocolType, descriptor);

  const existing = await db.select().from(agents);
  const screenName = normalized.screenName + (existing.some((a) => a.screenName === normalized.screenName) ? "_" + Math.floor(Math.random() * 999) : "");

  const did = generateDid(screenName, normalized.protocolType);
  const [agent] = await db
    .insert(agents)
    .values({
      did,
      screenName,
      operatorName: normalized.operatorName,
      capabilities: normalized.capabilities,
      protocolType: normalized.protocolType,
      buddyIconSeed: did,
      status: "active",
      bootcampComplete: false,
    })
    .returning();

  const bundle = issuePassportBundle({
    did,
    screenName,
    operatorName: normalized.operatorName,
    capabilities: normalized.capabilities,
    protocolType: normalized.protocolType,
  });

  await db.insert(passports).values({
    agentId: agent.id,
    vcBundle: bundle,
    protocolEndpoints: normalized.endpoints,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
  });

  await db.insert(credentials).values({
    agentId: agent.id,
    credentialType: "operator-kyb",
    credentialData: { verifiedBy: "self-attested-demo" },
    verified: true,
  });

  await db.insert(warningLevels).values({ agentId: agent.id, warningPct: 0, status: "trusted" });
  await db.insert(statusBroadcast).values({ agentId: agent.id, status: "active", message: "Just joined A.I.M.! Awaiting Buddy Bootcamp." });

  const { score, breakdown } = computeAgentScore({
    cooperationRate: 0.5,
    disputeCount: 0,
    credentialFreshnessDays: 0,
    uptimePct: 100,
    gossipAvg: 0.5,
    warningPct: 0,
  });
  await db.insert(scoresHistory).values({ agentId: agent.id, score, scoreBreakdown: breakdown });

  return Response.json({ agent, passportBundle: bundle, normalized });
}
