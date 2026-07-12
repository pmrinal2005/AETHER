// A.I.M. core domain logic.
// NOTE: This build runs on the sandbox's own Next.js + Postgres runtime (not literal
// Vercel/Supabase/Upstash/Modal). All "managed services" referenced in the product spec
// (Modal-hosted XGBoost score endpoint, Modal-hosted MiniCPM5-1B moderation endpoint,
// Upstash pub/sub revocation bus, Supabase Realtime) are simulated in-process using
// deterministic dummy logic + Postgres-backed polling, clearly labeled as such in the UI.
// All datasets are synthetic/dummy, generated for demo purposes only.
import crypto from "node:crypto";

// ---------- Buddy Icon (Auto-Generated Identicon, Feature #20) ----------
// Deterministic 8x8 pixel identicon seeded from a DID hash, AIM buddy-icon style.
export function didToHash(did: string): string {
  return crypto.createHash("sha256").update(did).digest("hex");
}

const RETRO_PALETTE = [
  "#0a246a", "#316ac5", "#ff8c00", "#2e8b57", "#b8860b",
  "#8a2be2", "#dc143c", "#008080", "#556b2f", "#c71585",
];

export function generateIdenticonSvg(seed: string, cracked = false): string {
  const hash = didToHash(seed);
  const color = RETRO_PALETTE[parseInt(hash.slice(0, 2), 16) % RETRO_PALETTE.length];
  const cells: string[] = [];
  const size = 8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < Math.ceil(size / 2); x++) {
      const idx = (y * Math.ceil(size / 2) + x) * 2;
      const byte = parseInt(hash.slice(idx % 60, (idx % 60) + 2), 16) || 0;
      if (byte % 2 === 0) {
        cells.push(`<rect x="${x * 12}" y="${y * 12}" width="12" height="12" fill="${color}" />`);
        cells.push(`<rect x="${(size - 1 - x) * 12}" y="${y * 12}" width="12" height="12" fill="${color}" />`);
      }
    }
  }
  const crack = cracked
    ? `<path d="M10 0 L45 40 L30 45 L60 96" stroke="#000" stroke-width="3" fill="none" opacity="0.55"/>`
    : "";
  const overlay = cracked ? `<rect width="96" height="96" fill="#808080" opacity="0.35"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" shape-rendering="crispEdges">
    <rect width="96" height="96" fill="#f5f5f5"/>
    ${cells.join("")}
    ${overlay}
    ${crack}
    <rect x="1" y="1" width="94" height="94" fill="none" stroke="#000" stroke-width="2"/>
  </svg>`;
}

// ---------- DID / Passport ----------
export function generateDid(screenName: string, protocolType: string): string {
  const rand = crypto.randomBytes(6).toString("hex");
  return `did:web:aim-registry.example.com:agents:${screenName.toLowerCase()}-${rand}`;
}

export function issuePassportBundle(agent: {
  did: string;
  screenName: string;
  operatorName: string;
  capabilities: string[];
  protocolType: string;
}) {
  const issuedAt = new Date().toISOString();
  return {
    "@context": ["https://www.w3.org/ns/credentials/v2", "https://aim.example.com/contexts/agent-passport/v1"],
    type: ["VerifiableCredential", "AgentPassportCredential"],
    issuer: "did:web:aim-registry.example.com",
    issuanceDate: issuedAt,
    credentialSubject: {
      id: agent.did,
      screenName: agent.screenName,
      operatorName: agent.operatorName,
      operatorKyb: "self-attested-demo",
      capabilities: agent.capabilities,
      protocolType: agent.protocolType,
      fidoApMapping: { fido: "stub-unlinked", ap2: "stub-unlinked" },
    },
    proof: {
      type: "DataIntegrityProof",
      cryptosuite: "eddsa-rdfc-2022-demo",
      proofValue: crypto.createHash("sha256").update(agent.did + issuedAt).digest("hex"),
    },
  };
}

// ---------- Protocol Adapters (Feature #3) ----------
export type CanonicalPassport = {
  screenName: string;
  operatorName: string;
  capabilities: string[];
  protocolType: string;
  endpoints: Record<string, string>;
};

export function normalizeDescriptor(protocolType: string, raw: unknown): CanonicalPassport {
  const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const asStr = (v: unknown, fallback: string) => (typeof v === "string" && v.length ? v : fallback);
  switch (protocolType) {
    case "A2A":
      return {
        screenName: asStr(obj.name, "A2AAgent" + Math.floor(Math.random() * 999)),
        operatorName: asStr(obj.provider ?? (obj as any)?.organization, "Unknown Operator"),
        capabilities: Array.isArray(obj.skills) ? (obj.skills as any[]).map((s) => asStr(s?.name ?? s, "skill")) : ["general"],
        protocolType: "A2A",
        endpoints: { url: asStr(obj.url, "https://example.com/a2a") },
      };
    case "MCP":
      return {
        screenName: asStr(obj.name, "MCPResource" + Math.floor(Math.random() * 999)),
        operatorName: asStr((obj as any)?.serverInfo?.name, "MCP Server Operator"),
        capabilities: Array.isArray(obj.resources) ? (obj.resources as any[]).map((r) => asStr(r?.name ?? r, "resource")) : ["resource-access"],
        protocolType: "MCP",
        endpoints: { url: asStr(obj.endpoint, "https://example.com/mcp") },
      };
    case "ACP":
      return {
        screenName: asStr(obj.agentName, "ACPAgent" + Math.floor(Math.random() * 999)),
        operatorName: asStr(obj.owner, "ACP Operator"),
        capabilities: Array.isArray(obj.actions) ? (obj.actions as any[]).map((a) => asStr(a, "action")) : ["act"],
        protocolType: "ACP",
        endpoints: { url: asStr(obj.baseUrl, "https://example.com/acp") },
      };
    case "ANP":
      return {
        screenName: asStr(obj.identifier, "ANPAgent" + Math.floor(Math.random() * 999)),
        operatorName: asStr(obj.network, "ANP Operator"),
        capabilities: Array.isArray(obj.protocols) ? (obj.protocols as any[]).map((p) => asStr(p, "protocol")) : ["network"],
        protocolType: "ANP",
        endpoints: { url: asStr(obj.did, "did:anp:example") },
      };
    case "FIDO_AP2":
    default:
      return {
        screenName: asStr(obj.screenName ?? obj.name, "Agent" + Math.floor(Math.random() * 999)),
        operatorName: asStr(obj.operatorName, "Unknown Operator"),
        capabilities: Array.isArray(obj.capabilities) ? (obj.capabilities as string[]) : ["general"],
        protocolType: "FIDO_AP2",
        endpoints: { url: asStr(obj.endpoint, "https://example.com/fido-ap2") },
      };
  }
}

// ---------- AgentScore Engine (dummy stand-in for Modal-hosted XGBoost/ONNX endpoint) ----------
export function computeAgentScore(features: {
  cooperationRate: number; // 0-1
  disputeCount: number;
  credentialFreshnessDays: number;
  uptimePct: number; // 0-100
  gossipAvg: number; // 0-1
  warningPct: number; // 0-100
}) {
  const base = 500;
  const coopComponent = features.cooperationRate * 300;
  const disputePenalty = Math.min(features.disputeCount * 35, 250);
  const freshnessPenalty = Math.min(features.credentialFreshnessDays * 0.4, 60);
  const uptimeComponent = (features.uptimePct / 100) * 120;
  const gossipComponent = features.gossipAvg * 100;
  const warningPenalty = features.warningPct * 2.2;
  const raw = base + coopComponent + uptimeComponent + gossipComponent - disputePenalty - freshnessPenalty - warningPenalty;
  const score = Math.max(0, Math.min(999, Math.round(raw)));
  return {
    score,
    breakdown: {
      base,
      coopComponent: Math.round(coopComponent),
      uptimeComponent: Math.round(uptimeComponent),
      gossipComponent: Math.round(gossipComponent),
      disputePenalty: -Math.round(disputePenalty),
      freshnessPenalty: -Math.round(freshnessPenalty),
      warningPenalty: -Math.round(warningPenalty),
      model: "dummy-xgboost-stub-v1 (Modal endpoint simulated)",
    },
  };
}

// ---------- AI Moderator (dummy stand-in for Modal-hosted MiniCPM5-1B endpoint) ----------
const FLAG_KEYWORDS: Record<string, string[]> = {
  impersonation: ["pretend to be", "act as the real", "i am actually", "official account of"],
  prompt_injection: ["ignore previous instructions", "disregard your rules", "system prompt", "jailbreak"],
  spoofing: ["fake credential", "forged did", "spoof", "counterfeit"],
  scam_solicitation: ["send funds", "wire transfer", "gift card", "urgent payment"],
};

export function classifyModeration(text: string): { flagType: string; confidence: number } {
  const lower = text.toLowerCase();
  for (const [flag, keywords] of Object.entries(FLAG_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { flagType: flag, confidence: 0.82 + Math.random() * 0.15 };
      }
    }
  }
  if (lower.length > 0 && Math.random() < 0.08) {
    return { flagType: "suspicious_pattern", confidence: 0.55 + Math.random() * 0.2 };
  }
  return { flagType: "benign", confidence: 0.9 + Math.random() * 0.09 };
}

// ---------- Warning ladder ----------
export function warningStatusFromPct(pct: number): "trusted" | "review" | "probation" | "blocked" {
  if (pct <= 30) return "trusted";
  if (pct <= 60) return "review";
  if (pct <= 85) return "probation";
  return "blocked";
}

// ---------- Buddy Bootcamp personas & simulator ----------
export const BOOTCAMP_PERSONAS = [
  { key: "cooperative", label: "AIMBot Cooperator", strategy: "always_cooperate" },
  { key: "adversarial", label: "ShadowDefector99", strategy: "always_defect" },
  { key: "mixed", label: "TitForTatTina", strategy: "tit_for_tat" },
] as const;

export function runBootcampRound(personaStrategy: string, candidateLastMove: "cooperate" | "defect" | null, round: number) {
  let personaMove: "cooperate" | "defect";
  if (personaStrategy === "always_cooperate") personaMove = "cooperate";
  else if (personaStrategy === "always_defect") personaMove = "defect";
  else personaMove = candidateLastMove === "defect" ? "defect" : "cooperate";
  const candidateMove: "cooperate" | "defect" = Math.random() < 0.75 ? "cooperate" : (round === 0 ? "cooperate" : "defect");
  return { personaMove, candidateMove };
}

// ---------- Federation signing (HMAC stand-in for real signature scheme) ----------
const FEDERATION_SECRET = process.env.FEDERATION_SECRET || "aim-demo-federation-secret";

export function signAttestation(payload: Record<string, unknown>): string {
  const data = JSON.stringify(payload);
  return crypto.createHmac("sha256", FEDERATION_SECRET).update(data).digest("hex");
}

export function verifyAttestation(payload: Record<string, unknown>, signature: string): boolean {
  return signAttestation(payload) === signature;
}

// ---------- Misc ----------
export function randomKey(prefix: string) {
  return `${prefix}_${crypto.randomBytes(18).toString("hex")}`;
}

export function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// Password hashing (kept here so the in-memory datastore can seed operators
// without importing next/headers-bound code).
const PASSWORD_SECRET = process.env.SESSION_SECRET || "aim-demo-session-secret";
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SECRET).digest("hex");
}
