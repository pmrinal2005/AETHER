import { NextResponse } from 'next/server';
import { isUpstashConfigured, publishRevocation, readRevocationEvents } from '@/lib/upstash';

export const runtime = 'nodejs';

// Phase 1.3 — basic publish/subscribe test for the Upstash `revocation-bus`.
// GET  → read recent events (external subscribers long-poll this)
// POST → publish a test/real revocation event { agentId, screenName, reason }
export async function GET() {
  if (!isUpstashConfigured) {
    return NextResponse.json({ configured: false, events: [] });
  }
  const events = await readRevocationEvents(20);
  return NextResponse.json({ configured: true, events });
}

export async function POST(req) {
  if (!isUpstashConfigured) {
    return NextResponse.json({ ok: false, reason: 'upstash-not-configured' }, { status: 200 });
  }
  const body = await req.json().catch(() => ({}));
  const res = await publishRevocation({
    type: 'revocation',
    agentId: body.agentId || 'test-agent',
    screenName: body.screenName || 'TestAgent',
    reason: body.reason || 'manual-test',
  });
  return NextResponse.json(res);
}
