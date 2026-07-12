import { runSeed } from "@/lib/datastore";

export const dynamic = "force-dynamic";

// "Reset Demo Data" button — re-seeds all synthetic dummy demo data on demand.
export async function POST() {
  try {
    const result = runSeed();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
