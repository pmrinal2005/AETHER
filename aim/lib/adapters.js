// Bridge so Next app code imports adapters via '@/lib/adapters'.
// Re-exports the canonical protocol adapters from /adapters (single source of truth).
export {
  parseA2A,
  parseMCP,
  parseACP,
  parseANP,
  parseFidoAp2,
  normalizeDescriptor,
  SUPPORTED_PROTOCOLS,
} from '../adapters/index.mjs';
export { emptyPassport, validatePassport } from '../adapters/schema.mjs';

// Sample descriptors used to prefill the wizard ("Load example").
export const SAMPLE_DESCRIPTORS = {
  a2a: {
    name: 'ShopBot2000',
    provider: { organization: 'Acme Retail Co' },
    url: 'https://agents.acme.example/shopbot',
    skills: [
      { id: 'checkout-negotiation', name: 'Checkout Negotiation' },
      { id: 'catalog-search', name: 'Catalog Search' },
    ],
  },
  mcp: {
    serverInfo: { name: 'TravelGenie', vendor: 'Wanderlust Inc' },
    protocolVersion: '2025-06-18',
    endpoint: 'https://mcp.wanderlust.example/sse',
    transport: 'sse',
    capabilities: {
      tools: [{ name: 'flight-search' }, { name: 'itinerary-build' }],
      resources: [{ name: 'destination-guide', uri: 'guide://dest' }],
    },
  },
  acp: {
    agent: {
      name: 'SupportPal',
      owner: 'HelpDesk LLC',
      endpoint: 'https://acp.helpdesk.example/agent',
      services: [{ type: 'ticket-triage' }, { type: 'kb-lookup' }],
      messaging: 'async',
    },
  },
  anp: {
    did: 'did:wba:anp.example:agent:scrapey_x',
    owner: 'Unknown Operator',
    ad: {
      endpoint: 'https://anp.example/scrapey',
      capabilities: [{ name: 'web-scrape' }, { name: 'bulk-request' }],
    },
  },
  'fido-ap2': {
    agentName: 'PayAdapter',
    merchant: 'FinBridge',
    rpId: 'finbridge.example',
    credentialId: 'AP2-CRED-8842',
    mandateRef: 'mandate://finbridge/authz/771',
    endpoint: 'https://ap2.finbridge.example/agent',
    mandateTypes: ['intent-mandate', 'cart-mandate'],
  },
};
