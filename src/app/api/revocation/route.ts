import { db } from "@/db";
import { revocationEvents } from "@/db/schema";
import { gt, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Simulated Upstash "revocation-bus" channel: since this sandbox has no external Redis,
// we persist events to Postgres and let clients poll for new events since a cursor id.
// This preserves the architectural separation described in the spec: this endpoint
// represents the cross-service broadcast bus, while Supabase-Realtime-style in-app
// updates are approximated by short client polling intervals elsewhere.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const since = Number(searchParams.get("since") ?? 0);
  const rows = await db.select().from(revocationEvents).where(gt(revocationEvents.id, since)).orderBy(desc(revocationEvents.id));
  return Response.json({ events: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { agentId, eventType, payload } = body as { agentId: number; eventType: string; payload?: Record<string, unknown> };
  const [event] = await db.insert(revocationEvents).values({ agentId, eventType, payload: payload ?? {} }).returning();
  return Response.json({ event });
}
