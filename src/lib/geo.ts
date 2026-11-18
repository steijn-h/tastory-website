// Afstanden tussen plaatsen, voor "plaatsen in de buurt" op de stadspagina's.
import type { CityGroup } from './restaurants';

export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Middelpunt van een plaats: gemiddelde van de restaurants met coördinaten. */
export function cityCenter(city: CityGroup): [number, number] | null {
  const points = city.restaurants.filter(
    (r) => typeof r.lat === 'number' && typeof r.lng === 'number',
  );
  if (points.length === 0) return null;
  const lat = points.reduce((s, r) => s + (r.lat as number), 0) / points.length;
  const lng = points.reduce((s, r) => s + (r.lng as number), 0) / points.length;
  return [lat, lng];
}

/** Dichtstbijzijnde andere plaatsen, met afstand in hele kilometers. */
export function nearestCities(city: CityGroup, all: CityGroup[], limit = 6) {
  const center = cityCenter(city);
  if (!center) return [];
  return all
    .filter((c) => c.slug !== city.slug)
    .map((c) => {
      const other = cityCenter(c);
      return other ? { city: c, km: distanceKm(center, other) } : null;
    })
    .filter((x): x is { city: CityGroup; km: number } => x !== null)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
    .map((x) => ({ ...x, km: Math.max(1, Math.round(x.km)) }));
}
