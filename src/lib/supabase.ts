// Supabase-client voor openbare gegevens, server-side (alleen in .astro-
// frontmatter en API-routes). Gebruikt de publieke anon key zonder sessie:
// dezelfde rechten als een gast in de app. Row-Level Security in Supabase
// bepaalt wat zichtbaar is. Voor ingelogde gebruikers: supabase-server.ts
// (server) en supabase-browser.ts (browser).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from 'astro:env/client';

export { SUPABASE_ANON_KEY, SUPABASE_URL };

export const supabaseConfigured = SUPABASE_ANON_KEY.length > 0;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'tastory-website' } },
    });
  }
  return client;
}
