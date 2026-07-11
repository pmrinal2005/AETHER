'use client';
import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client (anon key — safe to expose).
// Uses NEXT_PUBLIC_ env vars. RLS enforces access rules.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Guard so local dev without env vars doesn't hard-crash the whole app;
// components using this should handle a null client gracefully.
export const supabase =
  url && anon
    ? createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const isSupabaseConfigured = Boolean(url && anon);
