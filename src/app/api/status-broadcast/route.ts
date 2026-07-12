import { store, nextId } from "@/lib/datastore";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  return Response.json({ statuses: s.statusBroadcast });
}

export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { agentId, status, message } = body as { agentId: number; status: string; message: string };
  let row = s.statusBroadcast.find((x) => x.agentId === agentId);
  if (row) {
    row.status = status;
    row.message = message;
    row.updatedAt = new Date().toISOString();
  } else {
    row = { id: nextId("statusBroadcast"), agentId, status, message, updatedAt: new Date().toISOString() };
    s.statusBroadcast.push(row);
  }
  return Response.json({ status: row });
}
