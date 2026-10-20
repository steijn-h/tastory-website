// Supabase-client in de browser voor ingelogde gebruikers. De sessie staat in
// cookies (niet in localStorage), zodat de server hem ook kan lezen voor
// pagina's als /account. Inloggen gebeurt rechtstreeks vanuit de browser:
// Supabase telt inlogpogingen per IP-adres, en via de server zouden alle
// bezoekers hetzelfde adres delen.
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from 'astro:env/client';
import { AUTH_COOKIE_OPTIONS } from './auth-cookie';

let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!SUPABASE_ANON_KEY) throw new Error('Inloggen is tijdelijk niet beschikbaar.');
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      global: { headers: { 'X-Client-Info': 'tastory-website' } },
    });
  }
  return client;
}
