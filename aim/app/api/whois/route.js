import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminConfigured } from '@/lib/supabaseAdmin';
import { sha256Hex } from '@/lib/did';

export const runtime = 'nodejs';

// GET /api/whois?q=...  (Phase 2.4)
// Search by screen_name or endpoint URL → unified trust profile card.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!isAdminConfigured) {
    return NextResponse.json({ results: [], note: 'Supabase not configured (demo mode).' });
  }

  const admin = getSupabaseAdmin();

  try {
    let query = admin
      .from('agents')
      .select('id, did, screen_name, operator_name, capabilities, protocol_type, status');

    if (q) {
      // match screen name OR endpoint in did/operator (basic ilike search)
      query = query.or(`screen_name.ilike.%${q}%,did.ilike.%${q}%,operator_name.ilike.%${q}%`);
    }
    const { data: agents, error } = await query.limit(25);
    if (error) throw error;

    // Enrich with latest score, warning status, endpoints, icon hash
    const results = await Promise.all(
      (agents || []).map(async (a) => {
        const [{ data: score }, { data: warn }, { data: pass }] = await Promise.all([
          admin
            .from('scores_history')
            .select('score')
            .eq('agent_id', a.id)
            .order('computed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          admin
            .from('warning_levels')
            .select('status, warning_pct')
            .eq('agent_id', a.id)
            .maybeSingle(),
          admin
            .from('passports')
            .select('protocol_endpoints')
            .eq('agent_id', a.id)
            .order('issued_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        return {
          ...a,
          icon_hash: await sha256Hex(a.did || a.screen_name),
          score: score?.score ?? null,
          warning_status: warn?.status ?? 'trusted',
          warning_pct: warn?.warning_pct ?? 0,
          endpoints: pass?.protocol_endpoints ?? {},
        };
      })
    );

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
