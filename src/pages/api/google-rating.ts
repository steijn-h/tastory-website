// Google-score (sterren + aantal reviews) van één restaurant, live opgehaald
// bij Google Places (New). Volgens de voorwaarden van Google mag alleen het
// place_id bewaard worden: de score zelf wordt nergens opgeslagen of gecachet
// (ook niet door het CDN: no-store). De restaurantpagina vraagt dit pas op als
// een bezoeker naar de reviews scrolt, en nooit voor bots.
//
// Kosten: elke aanroep is één "Place Details"-opvraag bij Google. Zet daarom in
// Google Cloud een dagquotum (zie docs/GOOGLE-REVIEWS.md).
export const prerender = false;

import type { APIRoute } from 'astro';
import { GOOGLE_PLACES_API_KEY } from 'astro:env/server';
import { getGooglePlaceId, isUuid } from '../../lib/restaurants';

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

// Eenvoudige rem per serverfunctie tegen herhaald opvragen door één bezoeker.
const hits = new Map<string, { at: number; n: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 60;

function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > WINDOW_MS) {
    hits.set(ip, { at: now, n: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n += 1;
  return h.n > MAX_PER_WINDOW;
}

const empty = (status = 204) =>
  new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ url, request, clientAddress }) => {
  const id = url.searchParams.get('id') ?? '';
  if (!GOOGLE_PLACES_API_KEY || !isUuid(id)) return empty();
  if (BOT_RE.test(request.headers.get('user-agent') ?? '')) return empty();

  let ip = 'onbekend';
  try {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress;
  } catch {
    // clientAddress is niet altijd beschikbaar.
  }
  if (limited(ip)) return empty(429);

  const placeId = await getGooglePlaceId(id);
  if (!placeId) return empty();

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=nl`,
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          // Alleen wat we tonen: minder velden = goedkoper.
          'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri',
        },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!res.ok) {
      console.error('[google-rating]', id, res.status);
      return empty();
    }
    const place = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
    };
    const rating = typeof place.rating === 'number' ? place.rating : null;
    const count = typeof place.userRatingCount === 'number' ? place.userRatingCount : 0;
    if (rating === null || count < 1) return empty();
    const mapsUrl =
      typeof place.googleMapsUri === 'string' &&
      /^https:\/\/(maps\.google\.com\/|www\.google\.com\/maps)/.test(place.googleMapsUri)
        ? place.googleMapsUri
        : `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
    return new Response(JSON.stringify({ rating, count, url: mapsUrl }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    console.error('[google-rating]', id, (err as Error).message);
    return empty();
  }
};
