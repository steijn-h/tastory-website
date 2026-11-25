// Lijst met alle restaurants (lichte kolommen) voor de eigen serverfuncties.
// Het CDN van Vercel bewaart dit antwoord 10 minuten, zodat niet elke
// serverfunctie zelf de database hoeft te vragen. Zie getAllRestaurants().
export const prerender = false;

import type { APIRoute } from 'astro';
import { loadAllRestaurantsFromDb } from '../../lib/restaurants';

export const GET: APIRoute = async () => {
  const rows = await loadAllRestaurantsFromDb();
  if (!rows) {
    return new Response('[]', {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  return new Response(JSON.stringify(rows), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  });
};
