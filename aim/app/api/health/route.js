import { NextResponse } from 'next/server';
import { isAdminConfigured } from '@/lib/supabaseAdmin';
import { isUpstashConfigured } from '@/lib/upstash';

export const runtime = 'nodejs';

// GET /api/health — verify the Phase-1 skeleton wiring (Phase 1.5).
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'A.I.M. — Agent Instant Messenger & Identity Manager',
    phase: '0-2 (Identity & Passport Layer)',
    wiring: {
      supabase: isAdminConfigured ? 'configured' : 'missing (demo mode)',
      supabasePublic: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      upstash: isUpstashConfigured ? 'configured' : 'missing',
      appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'not-set',
    },
    time: new Date().toISOString(),
  });
}
