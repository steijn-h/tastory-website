// Keukens voor de pagina's per stad en keuken (bijv. "Italiaanse restaurants
// in Enschede"). Het veld `cuisine` kan meerdere keukens bevatten,
// gescheiden door komma's ("Internationaal, Japans").
import { slugify } from './format';

/** Minimum aantal restaurants voor een eigen pagina; minder is te mager voor Google. */
export const MIN_RESTAURANTS_PER_CUISINE_PAGE = 3;

export function splitCuisines(value: string | null | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ];
}

export function cuisineSlug(cuisine: string): string {
  return slugify(cuisine);
}

// Bijvoeglijke vorm voor "… restaurants". Dutch is onregelmatig
// (Chinees → Chinese, Indiaas → Indiase, Mediterraans → Mediterrane), dus
// een vaste lijst; onbekende keukens krijgen "restaurants met … keuken".
const ADJECTIVE: Record<string, string> = {
  nederlands: 'Nederlandse',
  internationaal: 'Internationale',
  italiaans: 'Italiaanse',
  amerikaans: 'Amerikaanse',
  chinees: 'Chinese',
  grieks: 'Griekse',
  japans: 'Japanse',
  argentijns: 'Argentijnse',
  libanees: 'Libanese',
  spaans: 'Spaanse',
  frans: 'Franse',
  mexicaans: 'Mexicaanse',
  indiaas: 'Indiase',
  indonesisch: 'Indonesische',
  turks: 'Turkse',
  mediterraans: 'Mediterrane',
  thais: 'Thaise',
  'latijns-amerikaans': 'Latijns-Amerikaanse',
  surinaams: 'Surinaamse',
  vietnamees: 'Vietnamese',
  koreaans: 'Koreaanse',
  portugees: 'Portugese',
  marokkaans: 'Marokkaanse',
  belgisch: 'Belgische',
  duits: 'Duitse',
  aziatisch: 'Aziatische',
};

// Geen landsnaam: in een zin met kleine letter ("een internationaal restaurant").
const NOT_A_COUNTRY = new Set(['internationaal', 'mediterraans', 'fusion', 'aziatisch']);
// Onverbogen vorm waar die afwijkt van de waarde in de database.
const UNINFLECTED: Record<string, string> = { mediterraans: 'mediterraan' };

/** Bijvoeglijk naamwoord in een lopende zin, verbogen ("Italiaanse") of niet ("Italiaans"). */
export function cuisineAdjective(cuisine: string, inflected: boolean): string | null {
  const key = cuisine.trim().toLowerCase();
  const word = inflected
    ? ADJECTIVE[key]
    : (UNINFLECTED[key] ?? (ADJECTIVE[key] ? cuisine.trim() : null));
  if (!word) return null;
  return NOT_A_COUNTRY.has(key) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1);
}

/** "Italiaans" → "Italiaanse restaurants"; "Fusion" → "Restaurants met fusion keuken". */
export function cuisineRestaurantsLabel(cuisine: string): string {
  const adjective = ADJECTIVE[cuisine.trim().toLowerCase()];
  return adjective
    ? `${adjective} restaurants`
    : `Restaurants met ${cuisine.trim().toLowerCase()} keuken`;
}

export interface CuisineGroup<T> {
  name: string;
  slug: string;
  restaurants: T[];
}

/** Restaurants per keuken; een restaurant met twee keukens staat in beide groepen. */
export function groupByCuisine<T extends { cuisine: string | null }>(rows: T[]): CuisineGroup<T>[] {
  const map = new Map<string, CuisineGroup<T>>();
  for (const r of rows) {
    for (const name of splitCuisines(r.cuisine)) {
      const slug = cuisineSlug(name);
      if (!slug) continue;
      const group = map.get(slug) ?? { name, slug, restaurants: [] };
      group.restaurants.push(r);
      map.set(slug, group);
    }
  }
  return [...map.values()].sort(
    (a, b) => b.restaurants.length - a.restaurants.length || a.name.localeCompare(b.name, 'nl'),
  );
}
