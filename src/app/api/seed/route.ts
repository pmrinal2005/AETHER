import { runSeed } from "@/lib/seedLogic";

export const dynamic = "force-dynamic";

// Demo Data Reset button (Feature #97) — reseeds all dummy demo data on demand.
export async function POST() {
  try {
    const result = await runSeed();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
