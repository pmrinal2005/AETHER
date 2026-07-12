import { store } from "@/lib/datastore";

export const dynamic = "force-dynamic";

// Aggregated dashboard snapshot consumed by the retro desktop shell.
// "latestScores" mirrors the original SELECT DISTINCT ON (agent_id) ... ORDER BY
// computed_at DESC query using in-memory reduction.
export async function GET() {
  const s = store();

  const latestByAgent = new Map<number, (typeof s.scoresHistory)[number]>();
  for (const row of s.scoresHistory) {
    const prev = latestByAgent.get(row.agentId);
    if (!prev || new Date(row.computedAt).getTime() > new Date(prev.computedAt).getTime()) {
      latestByAgent.set(row.agentId, row);
    }
  }
  const latestScores = Array.from(latestByAgent.values()).map((r) => ({
    agent_id: r.agentId,
    score: r.score,
    score_breakdown: r.scoreBreakdown,
    computed_at: r.computedAt,
  }));

  const byNewest = <T extends { createdAt: string }>(arr: T[]) =>
    [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return Response.json({
    agents: [...s.agents].sort((a, b) => a.id - b.id),
    warnings: s.warningLevels,
    statuses: s.statusBroadcast,
    latestScores,
    disputes: byNewest(s.disputes),
    moderationQueue: byNewest(s.moderationQueue),
    edges: s.reputationEdges,
    delegations: s.delegationGraph,
    peers: s.federationPeers,
    syncLogs: byNewest(s.federationSyncLog).slice(0, 20),
    bootcamps: s.bootcampResults,
    apiKeys: s.apiKeys.map((k) => ({ ...k, keyHash: undefined })),
    passports: s.passports,
  });
}
