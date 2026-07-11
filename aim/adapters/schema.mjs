// ============================================================================
// A.I.M. — Canonical Passport Schema (Phase 2.2)
// All protocol adapters normalize their native descriptor into THIS shape.
// ============================================================================

/**
 * @typedef {Object} CanonicalPassport
 * @property {string} screenName        Display / buddy name
 * @property {string} operatorName      Human/org operator
 * @property {string} protocolType      a2a | mcp | acp | anp | fido-ap2
 * @property {string[]} capabilities    Normalized capability tags
 * @property {Object} protocolEndpoints { rpc, wellKnown, transport, ... }
 * @property {Object} raw               The original descriptor (audit)
 * @property {Object} credentialMappings FIDO/AP2 + other credential hints
 */

export function emptyPassport() {
  return {
    screenName: '',
    operatorName: 'Unknown Operator',
    protocolType: '',
    capabilities: [],
    protocolEndpoints: {},
    credentialMappings: { fidoAp2: { supported: false } },
    raw: {},
  };
}

// Basic validation used by the wizard + tests.
export function validatePassport(p) {
  const errors = [];
  if (!p.screenName) errors.push('screenName is required');
  if (!p.protocolType) errors.push('protocolType is required');
  if (!Array.isArray(p.capabilities)) errors.push('capabilities must be an array');
  return { valid: errors.length === 0, errors };
}
