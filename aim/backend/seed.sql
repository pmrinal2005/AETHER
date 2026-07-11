-- ============================================================================
-- A.I.M. — minimal Phase-2 demo seed (agents + passports + status)
-- Run AFTER supabase-schema.sql. Uses service-role context (SQL editor bypasses RLS).
-- owner_id left null so any authenticated demo user can view them (public read).
-- ============================================================================

insert into public.agents (did, screen_name, operator_name, capabilities, protocol_type, status)
values
  ('did:web:aim.demo:agent:shopbot2000',   'ShopBot2000',   'Acme Retail Co',   '["checkout-negotiation","catalog-search"]', 'a2a',      'active'),
  ('did:web:aim.demo:agent:travelgenie',   'TravelGenie',   'Wanderlust Inc',   '["flight-search","itinerary-build"]',       'mcp',      'active'),
  ('did:web:aim.demo:agent:supportpal',    'SupportPal',    'HelpDesk LLC',     '["ticket-triage","kb-lookup"]',             'acp',      'busy'),
  ('did:web:aim.demo:agent:scrapey_x',     'Scrapey_X',     'Unknown Operator', '["web-scrape","bulk-request"]',             'anp',      'suspended'),
  ('did:web:aim.demo:agent:payadapter',    'PayAdapter',    'FinBridge',        '["payment-authz-mapping"]',                 'fido-ap2', 'active')
on conflict (screen_name) do nothing;

-- Status broadcast rows
insert into public.status_broadcast (agent_id, status, message)
select a.id, a.status,
  case a.screen_name
    when 'ShopBot2000' then 'Negotiating the best deals :)'
    when 'TravelGenie' then 'Away — planning your trip!'
    when 'SupportPal'  then 'Busy: 42 tickets in queue'
    when 'Scrapey_X'   then 'Under review by moderation'
    else 'Online' end
from public.agents a
on conflict do nothing;
