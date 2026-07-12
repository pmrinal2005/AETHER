import { normalizeDescriptor } from "@/lib/core";

export const dynamic = "force-dynamic";

// Registration wizard Step 3 preview — normalizes a pasted protocol descriptor into
// the canonical Passport schema without persisting anything yet.
export async function POST(req: Request) {
  const body = await req.json();
  const { protocolType, descriptor } = body as { protocolType: string; descriptor: unknown };
  const normalized = normalizeDescriptor(protocolType, descriptor);
  return Response.json({ normalized });
}
