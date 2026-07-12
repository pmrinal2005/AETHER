import { db } from "@/db";
import {
  agents,
  warningLevels,
  statusBroadcast,
  scoresHistory,
  disputes,
  moderationQueue,
  reputationEdges,
  delegationGraph,
  federationPeers,
  federationSyncLog,
  bootcampResults,
  apiKeys,
  passports,
} from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    agentRows,
    warnings,
    statuses,
    latestScores,
    disputeRows,
    modQueue,
    edges,
    delegations,
    peers,
    syncLogs,
    bootcamps,
    keys,
    passportRows,
  ] = await Promise.all([
    db.select().from(agents).orderBy(agents.id),
    db.select().from(warningLevels),
    db.select().from(statusBroadcast),
    db.execute(sql`select distinct on (agent_id) agent_id, score, score_breakdown, computed_at from scores_history order by agent_id, computed_at desc`),
    db.select().from(disputes).orderBy(desc(disputes.createdAt)),
    db.select().from(moderationQueue).orderBy(desc(moderationQueue.createdAt)),
    db.select().from(reputationEdges),
    db.select().from(delegationGraph),
    db.select().from(federationPeers),
    db.select().from(federationSyncLog).orderBy(desc(federationSyncLog.createdAt)).limit(20),
    db.select().from(bootcampResults),
    db.select().from(apiKeys),
    db.select().from(passports),
  ]);

  return Response.json({
    agents: agentRows,
    warnings,
    statuses,
    latestScores: latestScores.rows,
    disputes: disputeRows,
    moderationQueue: modQueue,
    edges,
    delegations,
    peers,
    syncLogs,
    bootcamps,
    apiKeys: keys.map((k) => ({ ...k, keyHash: undefined })),
    passports: passportRows,
  });
}
