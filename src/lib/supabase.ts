// Supabase-client voor server-side gebruik (alleen in .astro-frontmatter en
// API-routes). Gebruikt de publieke anon key: dezelfde rechten als een gast in
// de app. Row-Level Security in Supabase bepaalt wat zichtbaar is.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.SUPABASE_URL || 'https://vyqpdtjpocndgdqylzeo.supabase.co';
const SUPABASE_ANON_KEY: string = import.meta.env.SUPABASE_ANON_KEY ?? '';

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
