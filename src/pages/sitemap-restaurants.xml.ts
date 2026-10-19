export const prerender = false;

import type { APIRoute } from 'astro';
import { getAllRestaurants, groupByCity, restaurantPath } from '../lib/restaurants';
import { escapeXml } from '../lib/format';
import { SITE_URL } from '../lib/links';

// Alle restaurantpagina's en stadspagina's, zodat Google ze kan vinden.
export const GET: APIRoute = async () => {
  const restaurants = (await getAllRestaurants()) ?? [];
  const today = new Date().toISOString().split('T')[0];

  const entry = (path: string, priority: string) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const urls = [
    entry('/restaurants', '0.9'),
    ...groupByCity(restaurants).map((c) => entry(`/restaurants/${c.slug}`, '0.8')),
    ...restaurants.map((r) => entry(restaurantPath(r), '0.8')),
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
