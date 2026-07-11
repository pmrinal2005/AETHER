import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client using the SERVICE ROLE key.
// NEVER import this into a client component. It bypasses RLS and is used
// exclusively by backend API routes (e.g. service-role insert into scores_history).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!url || !serviceRole) return null;
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const isAdminConfigured = Boolean(url && serviceRole);
