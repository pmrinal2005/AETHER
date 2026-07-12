import { store, nextId } from "@/lib/datastore";
import { generateDid, issuePassportBundle, normalizeDescriptor, computeAgentScore, warningStatusFromPct } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  return Response.json({ agents: [...s.agents].sort((a, b) => a.id - b.id) });
}

// Registration wizard final step: normalize descriptor -> create agent -> issue passport
// -> generate buddy icon seed -> initialize warning/status rows -> bootstrap score row.
export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { protocolType, descriptor } = body as { protocolType: string; descriptor: unknown };
  const normalized = normalizeDescriptor(protocolType, descriptor);

  const screenName =
    normalized.screenName +
    (s.agents.some((a) => a.screenName === normalized.screenName) ? "_" + Math.floor(Math.random() * 999) : "");

  const did = generateDid(screenName, normalized.protocolType);
  const agent = {
    id: nextId("agents"),
    did,
    screenName,
    operatorName: normalized.operatorName,
    capabilities: normalized.capabilities,
    protocolType: normalized.protocolType,
    buddyIconSeed: did,
    buddyIconUrl: null,
    createdAt: new Date().toISOString(),
    status: "active",
    bootcampComplete: false,
  };
  s.agents.push(agent);

  const bundle = issuePassportBundle({
    did,
    screenName,
    operatorName: normalized.operatorName,
    capabilities: normalized.capabilities,
    protocolType: normalized.protocolType,
  });

  s.passports.push({
    id: nextId("passports"),
    agentId: agent.id,
    vcBundle: bundle,
    protocolEndpoints: normalized.endpoints,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
  });

  s.credentials.push({
    id: nextId("credentials"),
    agentId: agent.id,
    credentialType: "operator-kyb",
    credentialData: { verifiedBy: "self-attested-demo" },
    verified: true,
    rotatedAt: new Date().toISOString(),
  });

  s.warningLevels.push({ id: nextId("warningLevels"), agentId: agent.id, warningPct: 0, lastIncidentAt: null, status: warningStatusFromPct(0) });
  s.statusBroadcast.push({ id: nextId("statusBroadcast"), agentId: agent.id, status: "active", message: "Just joined A.I.M.! Awaiting Buddy Bootcamp.", updatedAt: new Date().toISOString() });

  const { score, breakdown } = computeAgentScore({
    cooperationRate: 0.5,
    disputeCount: 0,
    credentialFreshnessDays: 0,
    uptimePct: 100,
    gossipAvg: 0.5,
    warningPct: 0,
  });
  s.scoresHistory.push({ id: nextId("scoresHistory"), agentId: agent.id, score, scoreBreakdown: breakdown, computedAt: new Date().toISOString() });

  return Response.json({ agent, passportBundle: bundle, normalized });
}
