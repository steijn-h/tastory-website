export const prerender = false;

import type { APIRoute } from 'astro';
import { getAllRestaurants, groupByCity, restaurantPath } from '../lib/restaurants';
import { priceLabel } from '../lib/format';
import { APP_STORE_URL, SITE_URL } from '../lib/links';

// llms.txt (https://llmstxt.org): een korte, feitelijke samenvatting van de
// site in Markdown voor AI-assistenten. Nog geen officiële standaard; het
// kost weinig en helpt modellen Tastory en de restaurants goed te beschrijven.
export const GET: APIRoute = async () => {
  const restaurants = (await getAllRestaurants()) ?? [];
  const cities = groupByCity(restaurants).sort(
    (a, b) => b.restaurants.length - a.restaurants.length,
  );

  const line = (r: (typeof restaurants)[number]) => {
    const details = [
      r.cuisine,
      r.price_level ? priceLabel(r.price_level) : null,
      r.weighted_score && r.weighted_score > 0
        ? `${Number(r.weighted_score).toFixed(1).replace('.', ',')}/5 (${r.published_review_count === 1 ? '1 review' : `${r.published_review_count ?? 0} reviews`})`
        : null,
    ].filter(Boolean);
    return `- [${r.name}](${SITE_URL}${restaurantPath(r)})${details.length ? `: ${details.join(', ')}` : ''}`;
  };

  const body = `# Tastory

> Tastory is een Nederlands platform om restaurants te zoeken en te ontdekken. Gasten bekijken video, foto's, menukaarten en geverifieerde reviews van andere gasten, via de app (iOS) en op tastory.nl. Elk restaurant heeft een eigen openbare pagina.

Reviews op Tastory komen van gasten met een account. Reviews met een GPS check-in in het restaurant tellen zwaarder; een review wordt pas openbaar als het bezoek voldoende bevestigd is. De score op een restaurantpagina is een gewogen gemiddelde (1–5).

## Belangrijke pagina's

- [Alle restaurants](${SITE_URL}/restaurants): zoeken op naam, stad en keuken
- [Tastory voor gasten](${SITE_URL}/oplossingen/gebruikers)
- [Tastory voor restaurants](${SITE_URL}/oplossingen/restaurants)
- [Veelgestelde vragen](${SITE_URL}/faq)
- [Contact](${SITE_URL}/contact)
- [App downloaden](${APP_STORE_URL})

## Restaurants per stad

${cities
  .map(
    (c) =>
      `### [${c.name}](${SITE_URL}/restaurants/${c.slug}) (${c.restaurants.length})\n\n${c.restaurants
        .filter((r) => r.slug && r.name)
        .map(line)
        .join('\n')}`,
  )
  .join('\n\n')}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
