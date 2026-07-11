import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminConfigured } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// GET /.well-known/did.json  (Phase 2.1 — did:web anchor)
// Serves the registry-level DID Document listing controlled agent DIDs.
export async function GET() {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aim.local';
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const registryDid = `did:web:${host}`;

  const doc = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: registryDid,
    verificationMethod: [],
    service: [
      {
        id: `${registryDid}#agentwhois`,
        type: 'AgentWhoisService',
        serviceEndpoint: `https://${host}/api/whois`,
      },
      {
        id: `${registryDid}#verify`,
        type: 'TrustQueryService',
        serviceEndpoint: `https://${host}/api/whois`,
      },
    ],
    controlledAgents: [],
  };

  if (isAdminConfigured) {
    try {
      const admin = getSupabaseAdmin();
      const { data } = await admin.from('agents').select('did').limit(100);
      doc.controlledAgents = (data || []).map((a) => a.did);
    } catch {
      /* ignore — still serve base doc */
    }
  }

  return NextResponse.json(doc, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
