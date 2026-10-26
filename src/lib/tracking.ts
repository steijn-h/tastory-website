// Gedrag van ingelogde gebruikers op de website opslaan, net als
// utils/trackEvent.ts in de app (zelfde tabellen user_behavior en
// recent_views, zelfde gebeurtenissen). Gebruikt voor de aanbevelingen in app
// én website. Uit te zetten in Mijn Tastory; die keuze geldt per browser,
// zoals in de app per toestel.
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from 'astro:env/client';
import { AUTH_COOKIE_NAME } from './auth-cookie';

export const TRACKING_OPT_OUT_KEY = 'tastory_tracking_opt_out';

export function trackingOptedOut(): boolean {
  try {
    return localStorage.getItem(TRACKING_OPT_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTrackingOptOut(optOut: boolean): void {
  try {
    if (optOut) localStorage.setItem(TRACKING_OPT_OUT_KEY, 'true');
    else localStorage.removeItem(TRACKING_OPT_OUT_KEY);
  } catch {
    /* geen opslag beschikbaar */
  }
}

let ctx: Promise<{ supabase: SupabaseClient; userId: string } | null> | null = null;
// Voor verzoeken bij het verlaten van de pagina (die moeten synchroon starten).
let leaveAuth: { userId: string; token: string } | null = null;

/** Supabase alleen laden voor ingelogde gebruikers die het niet uitgezet hebben. */
function getContext() {
  if (trackingOptedOut()) return Promise.resolve(null);
  if (!document.cookie.split(';').some((c) => c.trim().startsWith(AUTH_COOKIE_NAME)))
    return Promise.resolve(null);
  ctx ??= import('./supabase-browser').then(async ({ getBrowserSupabase }) => {
    const supabase = getBrowserSupabase();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (userId && data.session) leaveAuth = { userId, token: data.session.access_token };
    return userId ? { supabase, userId } : null;
  });
  return ctx;
}

interface TrackEvent {
  event: string;
  restaurantId?: string | null;
  cuisine?: string | null;
  durationSeconds?: number | null;
}

export function trackEvent({
  event,
  restaurantId = null,
  cuisine = null,
  durationSeconds = null,
}: TrackEvent): void {
  void getContext()
    .then((c) =>
      c?.supabase.from('user_behavior').insert({
        user_id: c.userId,
        event: event.slice(0, 64),
        restaurant_id: restaurantId,
        cuisine: cuisine ? cuisine.slice(0, 100) : null,
        duration_seconds: durationSeconds,
        metadata: { source: 'website' },
        created_at: new Date().toISOString(),
      }),
    )
    .catch(() => {});
}

export function upsertRecentView(restaurantId: string): void {
  void getContext()
    .then((c) =>
      c?.supabase
        .from('recent_views')
        .upsert(
          { user_id: c.userId, restaurant_id: restaurantId, viewed_at: new Date().toISOString() },
          { onConflict: 'user_id,restaurant_id' },
        ),
    )
    .catch(() => {});
}

/**
 * Zelfde als trackEvent, maar voor het moment dat de bezoeker de pagina
 * verlaat: een gewoon verzoek wordt dan afgebroken, keepalive niet. Werkt
 * alleen als er eerder op de pagina al een trackEvent was (sessie bekend).
 */
export function trackEventOnLeave({
  event,
  restaurantId = null,
  cuisine = null,
  durationSeconds = null,
}: TrackEvent): void {
  if (!leaveAuth || trackingOptedOut()) return;
  try {
    void fetch(`${SUPABASE_URL}/rest/v1/user_behavior`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${leaveAuth.token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: leaveAuth.userId,
        event: event.slice(0, 64),
        restaurant_id: restaurantId,
        cuisine: cuisine ? cuisine.slice(0, 100) : null,
        duration_seconds: durationSeconds,
        metadata: { source: 'website' },
        created_at: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {
    /* niets aan te doen */
  }
}
