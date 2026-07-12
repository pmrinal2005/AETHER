import { store } from "@/lib/datastore";

export const dynamic = "force-dynamic";

// Health check: confirms the in-memory dummy datastore is seeded and reachable.
export async function GET() {
  try {
    const s = store();
    return Response.json({ ok: true, agents: s.agents.length, datastore: "in-memory-dummy" });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
