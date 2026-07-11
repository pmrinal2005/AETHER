// ============================================================================
// A.I.M. — Protocol Adapters (Feature 3, Phase 2.2)
// Separate parser functions for A2A / MCP / ACP / ANP / FIDO-AP2 descriptors,
// each normalizing into ONE canonical Passport schema.
// ============================================================================
import { emptyPassport } from './schema.mjs';

function asArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') return Object.keys(v);
  return [String(v)];
}

// ── A2A: Google Agent-to-Agent "Agent Card" ─────────────────────────────────
export function parseA2A(card) {
  const p = emptyPassport();
  p.protocolType = 'a2a';
  p.screenName = card.name || card.agentName || 'A2A Agent';
  p.operatorName = card.provider?.organization || card.provider || 'Unknown Operator';
  // A2A skills[] → capability tags
  p.capabilities = (card.skills || []).map((s) => s.id || s.name).filter(Boolean);
  if (p.capabilities.length === 0) p.capabilities = asArray(card.capabilities);
  p.protocolEndpoints = {
    url: card.url || card.endpoint,
    transport: 'jsonrpc',
    wellKnown: card.url ? `${card.url.replace(/\/$/, '')}/.well-known/agent.json` : undefined,
  };
  p.raw = card;
  return p;
}

// ── MCP: Model Context Protocol resource/server metadata ─────────────────────
export function parseMCP(meta) {
  const p = emptyPassport();
  p.protocolType = 'mcp';
  p.screenName = meta.serverInfo?.name || meta.name || 'MCP Server';
  p.operatorName = meta.serverInfo?.vendor || meta.vendor || 'Unknown Operator';
  const tools = asArray(meta.capabilities?.tools || meta.tools).map((t) =>
    typeof t === 'string' ? t : t.name
  );
  const resources = asArray(meta.capabilities?.resources || meta.resources).map((r) =>
    typeof r === 'string' ? r : r.name || r.uri
  );
  p.capabilities = [...tools, ...resources].filter(Boolean);
  p.protocolEndpoints = {
    url: meta.endpoint || meta.uri,
    transport: meta.transport || 'stdio/sse',
    protocolVersion: meta.protocolVersion,
  };
  p.raw = meta;
  return p;
}

// ── ACP: Agent Communication Protocol descriptor ─────────────────────────────
export function parseACP(desc) {
  const p = emptyPassport();
  p.protocolType = 'acp';
  p.screenName = desc.agent?.name || desc.name || 'ACP Agent';
  p.operatorName = desc.agent?.owner || desc.owner || 'Unknown Operator';
  p.capabilities = asArray(desc.agent?.services || desc.services || desc.capabilities).map((s) =>
    typeof s === 'string' ? s : s.type || s.name
  ).filter(Boolean);
  p.protocolEndpoints = {
    url: desc.agent?.endpoint || desc.endpoint,
    transport: 'acp',
    messaging: desc.messaging || desc.agent?.messaging,
  };
  p.raw = desc;
  return p;
}

// ── ANP: Agent Network Protocol descriptor ───────────────────────────────────
export function parseANP(desc) {
  const p = emptyPassport();
  p.protocolType = 'anp';
  p.screenName = desc.did?.split(':').pop() || desc.name || 'ANP Agent';
  p.operatorName = desc.owner || desc.operator || 'Unknown Operator';
  p.capabilities = asArray(desc.ad?.capabilities || desc.capabilities || desc.services).map((s) =>
    typeof s === 'string' ? s : s.name || s.type
  ).filter(Boolean);
  p.protocolEndpoints = {
    url: desc.ad?.endpoint || desc.endpoint,
    did: desc.did,
    transport: 'anp',
  };
  p.raw = desc;
  return p;
}

// ── FIDO / AP2: credential mapping stub (identity-only) ──────────────────────
export function parseFidoAp2(obj) {
  const p = emptyPassport();
  p.protocolType = 'fido-ap2';
  p.screenName = obj.agentName || obj.name || 'AP2 Agent';
  p.operatorName = obj.merchant || obj.operator || obj.rpName || 'Unknown Operator';
  p.capabilities = asArray(obj.capabilities || obj.mandateTypes || ['payment-authz-mapping']);
  p.protocolEndpoints = {
    rpId: obj.rpId,
    url: obj.endpoint,
    transport: 'fido-ap2',
  };
  // IMPORTANT: identity attestation ONLY. A.I.M. never settles payments.
  p.credentialMappings = {
    fidoAp2: {
      supported: true,
      role: 'identity-attestation-only',
      credentialId: obj.credentialId || obj.credential?.id,
      mandateRef: obj.mandateRef,
    },
  };
  p.raw = obj;
  return p;
}

const REGISTRY = {
  a2a: parseA2A,
  mcp: parseMCP,
  acp: parseACP,
  anp: parseANP,
  'fido-ap2': parseFidoAp2,
};

// Dispatch by declared protocol type.
export function normalizeDescriptor(protocolType, descriptor) {
  const fn = REGISTRY[protocolType];
  if (!fn) throw new Error(`Unknown protocolType: ${protocolType}`);
  const parsed = typeof descriptor === 'string' ? JSON.parse(descriptor) : descriptor;
  return fn(parsed);
}

export const SUPPORTED_PROTOCOLS = Object.keys(REGISTRY);
