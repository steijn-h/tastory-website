// Terugkomst na inloggen via Google/Apple (of een inloglink in de e-mail):
// de code wordt ingewisseld voor een sessie in cookies. Daarna controleert
// /inloggen het profiel (geblokkeerd, naam) en stuurt door naar `next`.
import type { APIRoute } from 'astro';
import { safeNextPath } from '../../lib/auth-cookie';
import { getServerSupabase } from '../../lib/supabase-server';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get('code');
  const next = safeNextPath(context.url.searchParams.get('next'));
  const supabase = getServerSupabase(context);
  if (!supabase || !code) {
    return context.redirect(`/inloggen?fout=1&next=${encodeURIComponent(next)}`, 303);
  }
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[auth] callback', error.message);
    return context.redirect(`/inloggen?fout=1&next=${encodeURIComponent(next)}`, 303);
  }
  return context.redirect(`/inloggen?vervolg=1&next=${encodeURIComponent(next)}`, 303);
};
