export type Agent = {
  id: number;
  did: string;
  screenName: string;
  operatorName: string;
  capabilities: string[];
  protocolType: string;
  buddyIconSeed: string;
  buddyIconUrl: string | null;
  createdAt: string;
  status: string;
  bootcampComplete: boolean;
};

export type WarningLevel = { id: number; agentId: number; warningPct: number; lastIncidentAt: string | null; status: string };
export type StatusBroadcastRow = { id: number; agentId: number; status: string; message: string; updatedAt: string };
export type LatestScore = { agent_id: number; score: number; score_breakdown: Record<string, unknown>; computed_at: string };
export type Dispute = { id: number; reporterAgentId: number | null; reportedAgentId: number; reason: string; evidence: Record<string, unknown>; status: string; createdAt: string };
export type ModerationItem = { id: number; agentId: number; flagType: string; aiConfidence: number; status: string; reviewedBy: string | null; createdAt: string };
export type ReputationEdge = { id: number; fromAgentId: number; toAgentId: number; edgeType: string; weight: number; updatedAt: string };
export type Delegation = { id: number; parentAgentId: number; subAgentId: number; scopes: string[]; expiry: string | null; guardianRules: Record<string, unknown> };
export type FederationPeer = { id: number; registryName: string; endpointUrl: string; publicKey: string; lastSyncedAt: string | null };
export type SyncLog = { id: number; peerId: number | null; direction: string; payload: Record<string, unknown>; signatureValid: boolean; createdAt: string };
export type BootcampResult = { id: number; agentId: number; roundLogs: unknown[]; cooperationRate: number; bootstrapScore: number; createdAt: string };
export type ApiKeyRow = { id: number; agentId: number; keyPreview: string; createdAt: string; revoked: boolean };
export type PassportRow = { id: number; agentId: number; vcBundle: Record<string, unknown>; protocolEndpoints: Record<string, unknown>; issuedAt: string; expiresAt: string | null };

export type DashboardData = {
  agents: Agent[];
  warnings: WarningLevel[];
  statuses: StatusBroadcastRow[];
  latestScores: LatestScore[];
  disputes: Dispute[];
  moderationQueue: ModerationItem[];
  edges: ReputationEdge[];
  delegations: Delegation[];
  peers: FederationPeer[];
  syncLogs: SyncLog[];
  bootcamps: BootcampResult[];
  apiKeys: ApiKeyRow[];
  passports: PassportRow[];
};

export function scoreFor(data: DashboardData, agentId: number): number | null {
  const row = data.latestScores.find((s) => s.agent_id === agentId);
  return row ? row.score : null;
}

export function warningFor(data: DashboardData, agentId: number): WarningLevel | undefined {
  return data.warnings.find((w) => w.agentId === agentId);
}

export function statusFor(data: DashboardData, agentId: number): StatusBroadcastRow | undefined {
  return data.statuses.find((s) => s.agentId === agentId);
}

export function agentName(data: DashboardData, agentId: number): string {
  return data.agents.find((a) => a.id === agentId)?.screenName ?? `Agent#${agentId}`;
}
