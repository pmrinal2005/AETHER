import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminConfigured } from '@/lib/supabaseAdmin';
import {
  buildDidWeb,
  generateKeyPair,
  issueVerifiableCredential,
  sha256Hex,
} from '@/lib/did';

export const runtime = 'nodejs';

// POST /api/passport/issue  (Phase 2.1 + 2.3)
// body: { passport: CanonicalPassport, ownerId?: string }
// → generates DID + VC bundle, stores agent + passport, returns record.
export async function POST(req) {
  try {
    const { passport, ownerId } = await req.json();
    if (!passport?.screenName || !passport?.protocolType) {
      return NextResponse.json({ error: 'passport.screenName and protocolType required' }, { status: 400 });
    }

    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aim.local';
    const did = buildDidWeb(domain, passport.screenName);
    const keyPair = await generateKeyPair();
    const iconHash = await sha256Hex(did);

    const { vc, issued_at, expires_at } = await issueVerifiableCredential({
      did,
      screenName: passport.screenName,
      operatorName: passport.operatorName,
      capabilities: passport.capabilities,
      protocolType: passport.protocolType,
      protocolEndpoints: passport.protocolEndpoints,
      keyPair,
    });

    // If Supabase not configured, return a local (unsaved) passport so the
    // wizard still completes in demo mode.
    if (!isAdminConfigured) {
      return NextResponse.json({
        local: true,
        iconHash,
        agent: {
          id: 'local-' + iconHash.slice(0, 8),
          did,
          screen_name: passport.screenName,
        },
        vc,
      });
    }

    const admin = getSupabaseAdmin();

    // Insert agent
    const { data: agent, error: aErr } = await admin
      .from('agents')
      .insert({
        owner_id: ownerId && ownerId !== 'local-demo' ? ownerId : null,
        did,
        screen_name: passport.screenName,
        operator_name: passport.operatorName,
        capabilities: passport.capabilities,
        protocol_type: passport.protocolType,
        buddy_icon_url: `identicon:${iconHash}`,
        status: 'active',
      })
      .select()
      .single();
    if (aErr) throw aErr;

    // Insert passport (VC bundle)
    const { data: pass, error: pErr } = await admin
      .from('passports')
      .insert({
        agent_id: agent.id,
        vc_bundle: vc,
        protocol_endpoints: passport.protocolEndpoints || {},
        issued_at,
        expires_at,
      })
      .select()
      .single();
    if (pErr) throw pErr;

    // Store the key credential (public key only; verified true)
    await admin.from('credentials').insert({
      agent_id: agent.id,
      credential_type: 'key',
      credential_data: { publicKeyHex: keyPair.publicKeyHex, keyType: keyPair.keyType, did },
      verified: true,
    });

    // Initial status broadcast
    await admin.from('status_broadcast').insert({
      agent_id: agent.id,
      status: 'active',
      message: 'Just registered on A.I.M.!',
    });

    return NextResponse.json({
      iconHash,
      agent,
      passportId: pass.id,
      vc,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
