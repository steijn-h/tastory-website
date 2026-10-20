export const prerender = false;

import type { APIRoute } from 'astro';
import { getAllRestaurants, groupByCity, restaurantPath } from '../lib/restaurants';
import { escapeXml } from '../lib/format';
import { SITE_URL } from '../lib/links';

// Alle restaurantpagina's en stadspagina's, zodat Google ze kan vinden.
export const GET: APIRoute = async () => {
  const restaurants = (await getAllRestaurants()) ?? [];
  // Geen <lastmod>: zonder echte wijzigingsdatum negeert Google hem (of gaat
  // hij de sitemap wantrouwen). changefreq/priority gebruikt Google niet.
  const entry = (path: string) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
  </url>`;

  const urls = [
    ...groupByCity(restaurants).map((c) => entry(`/restaurants/${c.slug}`)),
    // Alleen restaurants met een slug: een id-URL stuurt door (301) en hoort
    // niet in een sitemap.
    ...restaurants.filter((r) => r.slug).map((r) => entry(restaurantPath(r))),
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
