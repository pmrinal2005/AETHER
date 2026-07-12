import { db } from "@/db";
import { agents, scoresHistory, warningLevels, statusBroadcast } from "@/db/schema";
import { ilike, or, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return Response.json({ results: [] });

  const matches = await db
    .select()
    .from(agents)
    .where(or(ilike(agents.screenName, `%${q}%`), ilike(agents.did, `%${q}%`), ilike(agents.operatorName, `%${q}%`)));

  const results = await Promise.all(
    matches.map(async (agent) => {
      const [score] = await db.select().from(scoresHistory).where(eq(scoresHistory.agentId, agent.id)).orderBy(desc(scoresHistory.computedAt)).limit(1);
      const [warning] = await db.select().from(warningLevels).where(eq(warningLevels.agentId, agent.id));
      const [status] = await db.select().from(statusBroadcast).where(eq(statusBroadcast.agentId, agent.id));
      return { agent, score: score?.score ?? null, warning, status };
    })
  );

  return Response.json({ results });
}
