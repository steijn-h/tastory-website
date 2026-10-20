// Start van inloggen met Google/Apple: Supabase geeft de URL van de provider
// terug en bewaart de PKCE-sleutel in een cookie. Werkt pas als de provider in
// Supabase is ingesteld en in ENABLED_OAUTH_PROVIDERS staat.
import type { APIRoute } from 'astro';
import { ENABLED_OAUTH_PROVIDERS, safeNextPath } from '../../lib/auth-cookie';
import { getServerSupabase } from '../../lib/supabase-server';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const provider = context.url.searchParams.get('provider');
  const next = safeNextPath(context.url.searchParams.get('next'));
  const supabase = getServerSupabase(context);
  if (
    !supabase ||
    (provider !== 'google' && provider !== 'apple') ||
    !ENABLED_OAUTH_PROVIDERS.includes(provider)
  ) {
    return context.redirect(`/inloggen?next=${encodeURIComponent(next)}`, 303);
  }
  const redirectTo = new URL('/auth/callback', context.url.origin);
  redirectTo.searchParams.set('next', next);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo.toString(), skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    console.error('[auth] oauth start', provider, error?.message);
    return context.redirect(`/inloggen?fout=1&next=${encodeURIComponent(next)}`, 303);
  }
  return context.redirect(data.url, 303);
};
