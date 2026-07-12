// A.I.M. — Agent Instant Messenger & Identity Manager
// Full Postgres schema (Drizzle ORM) covering Identity, Reputation, Moderation & Federation layers.
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const operators = pgTable("operators", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  did: text("did").notNull().unique(),
  screenName: text("screen_name").notNull().unique(),
  operatorName: text("operator_name").notNull(),
  capabilities: jsonb("capabilities").notNull().default([]),
  protocolType: text("protocol_type").notNull().default("A2A"),
  buddyIconSeed: text("buddy_icon_seed").notNull(),
  buddyIconUrl: text("buddy_icon_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  bootcampComplete: boolean("bootcamp_complete").notNull().default(false),
});

export const passports = pgTable("passports", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  vcBundle: jsonb("vc_bundle").notNull(),
  protocolEndpoints: jsonb("protocol_endpoints").notNull().default({}),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  credentialType: text("credential_type").notNull(),
  credentialData: jsonb("credential_data").notNull().default({}),
  verified: boolean("verified").notNull().default(true),
  rotatedAt: timestamp("rotated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoresHistory = pgTable("scores_history", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  score: integer("score").notNull(),
  scoreBreakdown: jsonb("score_breakdown").notNull().default({}),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  reporterAgentId: integer("reporter_agent_id"),
  reportedAgentId: integer("reported_agent_id").notNull(),
  reason: text("reason").notNull(),
  evidence: jsonb("evidence").notNull().default({}),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reputationEdges = pgTable("reputation_edges", {
  id: serial("id").primaryKey(),
  fromAgentId: integer("from_agent_id").notNull(),
  toAgentId: integer("to_agent_id").notNull(),
  edgeType: text("edge_type").notNull().default("direct"),
  weight: doublePrecision("weight").notNull().default(0.5),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const delegationGraph = pgTable("delegation_graph", {
  id: serial("id").primaryKey(),
  parentAgentId: integer("parent_agent_id").notNull(),
  subAgentId: integer("sub_agent_id").notNull(),
  scopes: jsonb("scopes").notNull().default([]),
  expiry: timestamp("expiry", { withTimezone: true }),
  guardianRules: jsonb("guardian_rules").notNull().default({}),
});

export const moderationQueue = pgTable("moderation_queue", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  flagType: text("flag_type").notNull(),
  aiConfidence: doublePrecision("ai_confidence").notNull().default(0.5),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const warningLevels = pgTable("warning_levels", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().unique(),
  warningPct: doublePrecision("warning_pct").notNull().default(0),
  lastIncidentAt: timestamp("last_incident_at", { withTimezone: true }),
  status: text("status").notNull().default("trusted"),
});

export const federationPeers = pgTable("federation_peers", {
  id: serial("id").primaryKey(),
  registryName: text("registry_name").notNull(),
  endpointUrl: text("endpoint_url").notNull(),
  publicKey: text("public_key").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
});

export const federationSyncLog = pgTable("federation_sync_log", {
  id: serial("id").primaryKey(),
  peerId: integer("peer_id"),
  direction: text("direction").notNull(),
  payload: jsonb("payload").notNull().default({}),
  signatureValid: boolean("signature_valid").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bootcampResults = pgTable("bootcamp_results", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  roundLogs: jsonb("round_logs").notNull().default([]),
  cooperationRate: doublePrecision("cooperation_rate").notNull().default(0),
  bootstrapScore: integer("bootstrap_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statusBroadcast = pgTable("status_broadcast", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  message: text("message").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPreview: text("key_preview").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revoked: boolean("revoked").notNull().default(false),
});

export const revocationEvents = pgTable("revocation_events", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  fromAgentId: integer("from_agent_id"),
  fromLabel: text("from_label").notNull(),
  body: text("body").notNull(),
  flagged: boolean("flagged").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
