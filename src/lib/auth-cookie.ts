// Gedeeld tussen server en browser. Supabase bewaart de sessie in cookies
// met deze naam (soms in stukken: `<naam>.0`, `<naam>.1`).
import { SUPABASE_URL } from 'astro:env/client';

const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

export const AUTH_COOKIE_NAME = `sb-${projectRef}-auth-token`;

export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  secure: true,
  // Ingelogd blijven zoals in de app: een jaar, Supabase vernieuwt de sessie.
  maxAge: 60 * 60 * 24 * 365,
} as const;

/** Snel (zonder netwerk) zien of er een sessie-cookie is. Alleen voor de UI. */
export function hasAuthCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((part) => part.trim().startsWith(`${AUTH_COOKIE_NAME}`));
}

/** Alleen interne paden als doel na het inloggen (geen open redirect). */
export function safeNextPath(value: string | null | undefined, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}

/**
 * Inloggen met Google/Apple op de website. Leeg tot het in Supabase is
 * ingesteld (zie docs/WEBAPP-PLAN.md); daarna hier 'google' en/of 'apple'
 * toevoegen.
 */
export const ENABLED_OAUTH_PROVIDERS: ReadonlyArray<'google' | 'apple'> = [];
