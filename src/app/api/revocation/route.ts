import { store, nextId } from "@/lib/datastore";

export const dynamic = "force-dynamic";

// Simulated Upstash "revocation-bus" channel: since this build has no external Redis,
// events are stored in-memory and clients poll for new events since a cursor id.
// This preserves the architectural separation described in the spec: this endpoint
// represents the cross-service broadcast bus, while Supabase-Realtime-style in-app
// updates are approximated by short client polling intervals elsewhere.
export async function GET(req: Request) {
  const s = store();
  const { searchParams } = new URL(req.url);
  const since = Number(searchParams.get("since") ?? 0);
  const rows = s.revocationEvents.filter((e) => e.id > since).sort((a, b) => b.id - a.id);
  return Response.json({ events: rows });
}

export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { agentId, eventType, payload } = body as { agentId: number; eventType: string; payload?: Record<string, unknown> };
  const event = {
    id: nextId("revocationEvents"),
    agentId,
    eventType,
    payload: payload ?? {},
    createdAt: new Date().toISOString(),
  };
  s.revocationEvents.push(event);
  return Response.json({ event });
}
