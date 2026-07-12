import { db } from "@/db";
import { delegationGraph } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(delegationGraph);
  return Response.json({ delegations: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { parentAgentId, subAgentId, scopes, expiry, guardianRules } = body as {
    parentAgentId: number;
    subAgentId: number;
    scopes: string[];
    expiry?: string;
    guardianRules?: Record<string, unknown>;
  };
  const [row] = await db
    .insert(delegationGraph)
    .values({
      parentAgentId,
      subAgentId,
      scopes,
      expiry: expiry ? new Date(expiry) : null,
      guardianRules: guardianRules ?? { activeHours: { start: "09:00", end: "18:00" }, blockedCategories: [], actionCeiling: 100, autoApprove: false },
    })
    .returning();
  return Response.json({ delegation: row });
}

// Guardian Console save: update rules for an existing parent->sub-agent link.
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, guardianRules } = body as { id: number; guardianRules: Record<string, unknown> };
  const [row] = await db.update(delegationGraph).set({ guardianRules }).where(eq(delegationGraph.id, id)).returning();
  return Response.json({ delegation: row });
}
