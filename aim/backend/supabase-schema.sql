-- ============================================================================
-- A.I.M. — Agent Instant Messenger & Identity Manager
-- Supabase Postgres schema — Phase 1.2
-- 13 core tables + Row Level Security + Realtime publication
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================================

-- ── UUID generation ──
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. agents
-- ============================================================================
create table if not exists public.agents (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete set null, -- human operator
  did          text unique not null,
  screen_name  text unique not null,
  operator_name text,
  capabilities jsonb default '[]'::jsonb,
  protocol_type text,               -- a2a | mcp | acp | anp | fido-ap2
  buddy_icon_url text,              -- data-URI / storage ref of pixel identicon
  created_at   timestamptz default now(),
  status       text default 'active'  -- active | busy | suspended | revoked
);

-- ============================================================================
-- 2. passports
-- ============================================================================
create table if not exists public.passports (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid references public.agents(id) on delete cascade,
  vc_bundle     jsonb not null,       -- W3C Verifiable Credential bundle
  protocol_endpoints jsonb default '{}'::jsonb,
  issued_at     timestamptz default now(),
  expires_at    timestamptz
);

-- ============================================================================
-- 3. credentials
-- ============================================================================
create table if not exists public.credentials (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid references public.agents(id) on delete cascade,
  credential_type text,               -- kyb | capability | protocol-endpoint | key
  credential_data jsonb not null,
  verified        boolean default false,
  rotated_at      timestamptz
);

-- ============================================================================
-- 4. scores_history
-- ============================================================================
create table if not exists public.scores_history (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid references public.agents(id) on delete cascade,
  score           int not null,       -- 0..999
  score_breakdown jsonb default '{}'::jsonb,
  computed_at     timestamptz default now()
);

-- ============================================================================
-- 5. disputes
-- ============================================================================
create table if not exists public.disputes (
  id                 uuid primary key default gen_random_uuid(),
  reporter_agent_id  uuid references public.agents(id) on delete set null,
  reported_agent_id  uuid references public.agents(id) on delete cascade,
  reason             text,
  evidence           jsonb default '{}'::jsonb,
  status             text default 'open',   -- open | reviewing | resolved | dismissed
  created_at         timestamptz default now()
);

-- ============================================================================
-- 6. reputation_edges
-- ============================================================================
create table if not exists public.reputation_edges (
  id            uuid primary key default gen_random_uuid(),
  from_agent_id uuid references public.agents(id) on delete cascade,
  to_agent_id   uuid references public.agents(id) on delete cascade,
  edge_type     text not null,        -- direct | gossip
  weight        float default 0,
  updated_at    timestamptz default now()
);

-- ============================================================================
-- 7. delegation_graph
-- ============================================================================
create table if not exists public.delegation_graph (
  id              uuid primary key default gen_random_uuid(),
  parent_agent_id uuid references public.agents(id) on delete cascade,
  sub_agent_id    uuid references public.agents(id) on delete cascade,
  scopes          jsonb default '[]'::jsonb,
  expiry          timestamptz,
  guardian_rules  jsonb default '{}'::jsonb  -- time-of-day, category blocks, ceilings
);

-- ============================================================================
-- 8. moderation_queue
-- ============================================================================
create table if not exists public.moderation_queue (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid references public.agents(id) on delete cascade,
  flag_type     text,                 -- impersonation | spoofing | prompt-injection | benign
  ai_confidence float,
  status        text default 'pending', -- pending | approved | timeout | revoked
  reviewed_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

-- ============================================================================
-- 9. warning_levels
-- ============================================================================
create table if not exists public.warning_levels (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid references public.agents(id) on delete cascade unique,
  warning_pct     float default 0,
  last_incident_at timestamptz,
  status          text default 'trusted' -- trusted | review | probation | blocked
);

-- ============================================================================
-- 10. federation_peers
-- ============================================================================
create table if not exists public.federation_peers (
  id            uuid primary key default gen_random_uuid(),
  registry_name text,
  endpoint_url  text,
  public_key    text,
  last_synced_at timestamptz
);

-- ============================================================================
-- 11. bootcamp_results
-- ============================================================================
create table if not exists public.bootcamp_results (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid references public.agents(id) on delete cascade,
  round_logs       jsonb default '[]'::jsonb,
  cooperation_rate float,
  bootstrap_score  int
);

-- ============================================================================
-- 12. status_broadcast
-- ============================================================================
create table if not exists public.status_broadcast (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid references public.agents(id) on delete cascade,
  status     text default 'active',   -- active | busy | suspended | revoked
  message    text,
  updated_at timestamptz default now()
);

-- ============================================================================
-- 13. api_keys
-- ============================================================================
create table if not exists public.api_keys (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid references public.agents(id) on delete cascade,
  key_hash   text not null,
  created_at timestamptz default now(),
  revoked    boolean default false
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.agents           enable row level security;
alter table public.passports        enable row level security;
alter table public.credentials      enable row level security;
alter table public.scores_history   enable row level security;
alter table public.disputes         enable row level security;
alter table public.reputation_edges enable row level security;
alter table public.delegation_graph enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.warning_levels   enable row level security;
alter table public.federation_peers enable row level security;
alter table public.bootcamp_results enable row level security;
alter table public.status_broadcast enable row level security;
alter table public.api_keys         enable row level security;

-- ── Public read-only: agents, passports, status_broadcast ──
create policy "public_read_agents"    on public.agents          for select using (true);
create policy "public_read_passports" on public.passports       for select using (true);
create policy "public_read_status"    on public.status_broadcast for select using (true);

-- Also allow authenticated users to read supporting tables for the dashboard demo
create policy "auth_read_scores"     on public.scores_history   for select using (auth.role() = 'authenticated');
create policy "auth_read_disputes"   on public.disputes         for select using (auth.role() = 'authenticated');
create policy "auth_read_repedges"   on public.reputation_edges for select using (auth.role() = 'authenticated');
create policy "auth_read_delegation" on public.delegation_graph for select using (auth.role() = 'authenticated');
create policy "auth_read_modqueue"   on public.moderation_queue for select using (auth.role() = 'authenticated');
create policy "auth_read_warnings"   on public.warning_levels   for select using (auth.role() = 'authenticated');
create policy "auth_read_bootcamp"   on public.bootcamp_results for select using (auth.role() = 'authenticated');
create policy "auth_read_federation" on public.federation_peers for select using (auth.role() = 'authenticated');
create policy "auth_read_apikeys"    on public.api_keys         for select using (auth.role() = 'authenticated');
create policy "auth_read_creds"      on public.credentials      for select using (auth.role() = 'authenticated');

-- ── Owner-only write: agents ──
create policy "owner_insert_agents" on public.agents for insert with check (auth.uid() = owner_id);
create policy "owner_update_agents" on public.agents for update using (auth.uid() = owner_id);
create policy "owner_delete_agents" on public.agents for delete using (auth.uid() = owner_id);

-- ── Owner-only write: credentials (owner of the referenced agent) ──
create policy "owner_write_creds" on public.credentials for all
  using (exists (select 1 from public.agents a where a.id = credentials.agent_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents a where a.id = credentials.agent_id and a.owner_id = auth.uid()));

-- Owner may write their own agent's passport (issued during registration)
create policy "owner_write_passports" on public.passports for all
  using (exists (select 1 from public.agents a where a.id = passports.agent_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents a where a.id = passports.agent_id and a.owner_id = auth.uid()));

-- Owner may manage their own agent's status broadcast + api keys + delegation
create policy "owner_write_status" on public.status_broadcast for all
  using (exists (select 1 from public.agents a where a.id = status_broadcast.agent_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents a where a.id = status_broadcast.agent_id and a.owner_id = auth.uid()));
create policy "owner_write_apikeys" on public.api_keys for all
  using (exists (select 1 from public.agents a where a.id = api_keys.agent_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents a where a.id = api_keys.agent_id and a.owner_id = auth.uid()));
create policy "owner_write_delegation" on public.delegation_graph for all
  using (exists (select 1 from public.agents a where a.id = delegation_graph.parent_agent_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents a where a.id = delegation_graph.parent_agent_id and a.owner_id = auth.uid()));

-- Authenticated users may file disputes (report abuse)
create policy "auth_insert_disputes" on public.disputes for insert with check (auth.role() = 'authenticated');

-- ── Admin-only write: moderation_queue ──
-- "Admin" is modeled via a JWT app_metadata role = 'admin'.
create policy "admin_write_modqueue" on public.moderation_queue for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- ── Service-role-only insert: scores_history ──
-- NOTE: the service_role key bypasses RLS entirely, so backend routes using the
-- service_role client can always insert. We additionally forbid non-service roles.
create policy "no_client_insert_scores" on public.scores_history for insert with check (false);

-- ============================================================================
-- REALTIME PUBLICATION
-- Enable Realtime on: status_broadcast, moderation_queue, warning_levels,
--                     reputation_edges, scores_history
-- ============================================================================
alter publication supabase_realtime add table public.status_broadcast;
alter publication supabase_realtime add table public.moderation_queue;
alter publication supabase_realtime add table public.warning_levels;
alter publication supabase_realtime add table public.reputation_edges;
alter publication supabase_realtime add table public.scores_history;

-- ============================================================================
-- STORAGE BUCKET (buddy icons + uploaded evidence)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('aim-assets', 'aim-assets', true)
on conflict (id) do nothing;

create policy "public_read_assets" on storage.objects for select
  using (bucket_id = 'aim-assets');
create policy "auth_write_assets" on storage.objects for insert
  with check (bucket_id = 'aim-assets' and auth.role() = 'authenticated');
