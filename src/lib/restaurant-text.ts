// Korte beschrijving van een restaurant in gewone Nederlandse zinnen, uit de
// gegevens in de database. Uniek per pagina (de eigen beschrijving komt vaak
// letterlijk van de site van het restaurant) en makkelijk te citeren door
// zoekmachines en AI-assistenten.
import { cuisineAdjective, splitCuisines } from './cuisine';
import { priceLabel } from './format';

interface Input {
  name: string;
  city: string | null;
  address: string | null;
  cuisine: string | null;
  vibe: string | null;
  priceLevel: number | null;
  score: number | null;
  reviewCount: number;
}

const formatScore = (value: number) =>
  value.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "a", "a en b", "a, b en c" */
function joinNl(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} en ${items[items.length - 1]}`;
}

/** "Grotestraat 43, 7461 KE" → "Grotestraat 43" (postcode hoort niet in een zin). */
function streetOnly(address: string): string {
  return address
    .replace(/,?\s*\d{4}\s?[A-Z]{2}\b.*$/, '')
    .replace(/,\s*$/, '')
    .trim();
}

/** "een Amerikaans restaurant" / "een restaurant met een Nederlandse en Amerikaanse keuken" */
function restaurantPhrase(cuisine: string | null): string {
  const cuisines = splitCuisines(cuisine);
  if (cuisines.length === 1) {
    const adjective = cuisineAdjective(cuisines[0], false);
    return adjective
      ? `een ${adjective} restaurant`
      : `een restaurant met ${cuisines[0].toLowerCase()}keuken`;
  }
  if (cuisines.length > 1) {
    const adjectives = cuisines.map((c) => cuisineAdjective(c, true));
    if (adjectives.every(Boolean))
      return `een restaurant met een ${joinNl(adjectives as string[])} keuken`;
    return `een restaurant met ${joinNl(cuisines.map((c) => c.toLowerCase()))} keuken`;
  }
  return 'een restaurant';
}

/** "aan de Marktstraat 2 in Enschede" */
function locationPhrase(address: string | null, city: string | null): string {
  const street = address ? streetOnly(address) : '';
  const cityPart = city && !street.toLowerCase().includes(city.toLowerCase()) ? ` in ${city}` : '';
  if (!street) return cityPart;
  // "De Klomp 3" → "aan De Klomp 3", anders "aan de Marktstraat 2".
  const article = /^(de|het|'t)\s/i.test(street) ? 'aan' : 'aan de';
  return ` ${article} ${street}${cityPart}`;
}

export function describeRestaurant(input: Input): string {
  // Zonder keuken, adres of stad valt er niets zinnigs te zeggen.
  if (!input.cuisine && !input.address && !input.city) return '';
  const sentences = [
    `${input.name} is ${restaurantPhrase(input.cuisine)}${locationPhrase(input.address, input.city)}.`,
  ];

  const vibes = splitCuisines(input.vibe).map((v) => v.toLowerCase());
  const price = input.priceLevel ? priceLabel(input.priceLevel) : null;
  // Eén sfeerwoord: "De sfeer is gezellig en de prijsklasse is €€". Bij meer
  // woorden twee zinnen, anders staat er twee keer "en".
  if (vibes.length === 1 && price)
    sentences.push(`De sfeer is ${vibes[0]} en de prijsklasse is ${price}.`);
  else {
    if (vibes.length > 0) sentences.push(`De sfeer is ${joinNl(vibes)}.`);
    if (price) sentences.push(`De prijsklasse is ${price}.`);
  }

  if (input.score !== null && input.reviewCount > 0) {
    sentences.push(
      `Tastory-gasten geven het gemiddeld een ${formatScore(input.score)} uit 5 (${
        input.reviewCount === 1 ? '1 review' : `${input.reviewCount} reviews`
      }).`,
    );
  }
  return sentences.join(' ');
}

/** Eerste zin, voor de meta-omschrijving in Google. */
export function describeRestaurantShort(input: Input): string {
  return `${input.name} is ${restaurantPhrase(input.cuisine)}${locationPhrase(input.address, input.city)}.`;
}
