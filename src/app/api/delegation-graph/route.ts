import { store, nextId } from "@/lib/datastore";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  return Response.json({ delegations: s.delegationGraph });
}

export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { parentAgentId, subAgentId, scopes, expiry, guardianRules } = body as {
    parentAgentId: number;
    subAgentId: number;
    scopes: string[];
    expiry?: string;
    guardianRules?: Record<string, unknown>;
  };
  const row = {
    id: nextId("delegationGraph"),
    parentAgentId,
    subAgentId,
    scopes,
    expiry: expiry ? new Date(expiry).toISOString() : null,
    guardianRules: guardianRules ?? { activeHours: { start: "09:00", end: "18:00" }, blockedCategories: [], actionCeiling: 100, autoApprove: false },
  };
  s.delegationGraph.push(row);
  return Response.json({ delegation: row });
}

// Guardian Console save: update rules for an existing parent->sub-agent link.
export async function PATCH(req: Request) {
  const s = store();
  const body = await req.json();
  const { id, guardianRules } = body as { id: number; guardianRules: Record<string, unknown> };
  const row = s.delegationGraph.find((d) => d.id === id);
  if (row) row.guardianRules = guardianRules;
  return Response.json({ delegation: row });
}
