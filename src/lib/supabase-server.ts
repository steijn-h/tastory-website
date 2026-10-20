// Supabase-client op de server met de sessie van de bezoeker (uit cookies).
// Alleen gebruiken op pagina's die níet gecachet worden (account, review
// schrijven): Supabase kan hier vernieuwde sessie-cookies terugsturen.
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from 'astro:env/client';
import { AUTH_COOKIE_OPTIONS } from './auth-cookie';

interface Context {
  request: Request;
  cookies: AstroCookies;
}

export function getServerSupabase({ request, cookies }: Context): SupabaseClient | null {
  if (!SUPABASE_ANON_KEY) return null;
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') ?? '').map(({ name, value }) => ({
          name,
          value: value ?? '',
        }));
      },
      setAll(list) {
        for (const { name, value, options } of list) cookies.set(name, value, options);
      },
    },
    global: { headers: { 'X-Client-Info': 'tastory-website' } },
  });
}

/**
 * De ingelogde gebruiker, gecontroleerd bij Supabase (niet alleen de cookie
 * uitlezen: die kan vervalst zijn).
 */
export async function getServerUser(supabase: SupabaseClient | null): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
