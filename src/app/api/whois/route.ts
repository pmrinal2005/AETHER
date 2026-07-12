import { store } from "@/lib/datastore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = store();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (!q) return Response.json({ results: [] });

  const matches = s.agents.filter(
    (a) =>
      a.screenName.toLowerCase().includes(q) ||
      a.did.toLowerCase().includes(q) ||
      a.operatorName.toLowerCase().includes(q)
  );

  const results = matches.map((agent) => {
    const score = [...s.scoresHistory.filter((r) => r.agentId === agent.id)].sort(
      (a, b) => new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime()
    )[0];
    const warning = s.warningLevels.find((w) => w.agentId === agent.id);
    const status = s.statusBroadcast.find((st) => st.agentId === agent.id);
    return { agent, score: score?.score ?? null, warning, status };
  });

  return Response.json({ results });
}
