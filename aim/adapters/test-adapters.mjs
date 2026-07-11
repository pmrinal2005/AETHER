// Unit test for protocol adapters (Phase 2.2). Run: npm run test:adapters
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeDescriptor, SUPPORTED_PROTOCOLS } from './index.mjs';
import { validatePassport } from './schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(__dirname, 'fixtures', f), 'utf8'));

const cases = [
  ['a2a', 'a2a.json', 'ShopBot2000', ['checkout-negotiation', 'catalog-search']],
  ['mcp', 'mcp.json', 'TravelGenie', ['flight-search', 'itinerary-build', 'destination-guide']],
  ['acp', 'acp.json', 'SupportPal', ['ticket-triage', 'kb-lookup']],
  ['anp', 'anp.json', 'scrapey_x', ['web-scrape', 'bulk-request']],
  ['fido-ap2', 'fido-ap2.json', 'PayAdapter', ['intent-mandate', 'cart-mandate']],
];

let pass = 0;
let fail = 0;

console.log(`Supported protocols: ${SUPPORTED_PROTOCOLS.join(', ')}\n`);

for (const [proto, file, expectName, expectCaps] of cases) {
  const p = normalizeDescriptor(proto, load(file));
  const v = validatePassport(p);
  const nameOk = p.screenName === expectName;
  const capsOk = expectCaps.every((c) => p.capabilities.includes(c));
  const ok = v.valid && nameOk && capsOk && p.protocolType === proto;
  if (ok) {
    pass++;
    console.log(`✅ ${proto.padEnd(9)} → ${p.screenName} | caps: [${p.capabilities.join(', ')}]`);
  } else {
    fail++;
    console.log(`❌ ${proto} FAILED`, { valid: v.errors, nameOk, capsOk, got: p });
  }
}

// FIDO-AP2 must be identity-only (never payment settlement)
const fido = normalizeDescriptor('fido-ap2', load('fido-ap2.json'));
if (fido.credentialMappings.fidoAp2.role === 'identity-attestation-only') {
  pass++;
  console.log('✅ fido-ap2  → identity-attestation-only (no payment settlement) ✔');
} else {
  fail++;
  console.log('❌ fido-ap2 role is NOT identity-only!');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
