import { db } from "@/db";
import { statusBroadcast } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(statusBroadcast);
  return Response.json({ statuses: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { agentId, status, message } = body as { agentId: number; status: string; message: string };
  const [row] = await db
    .insert(statusBroadcast)
    .values({ agentId, status, message })
    .onConflictDoUpdate({ target: statusBroadcast.agentId, set: { status, message, updatedAt: new Date() } })
    .returning();
  return Response.json({ status: row });
}
