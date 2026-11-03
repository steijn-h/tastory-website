// Echte beoordeling van de app in de App Store (Nederland), voor de
// gestructureerde gegevens op de homepage. Google wil dat die cijfers kloppen
// met wat gebruikers zien; daarom niet vast in de code.
const LOOKUP_URL = 'https://itunes.apple.com/lookup?id=6762256086&country=nl';
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

export interface AppRating {
  value: number;
  count: number;
}

let cached: { at: number; rating: AppRating | null } | null = null;

export async function getAppRating(): Promise<AppRating | null> {
  if (cached && Date.now() - cached.at < MAX_AGE_MS) return cached.rating;
  let rating: AppRating | null = null;
  try {
    const res = await fetch(LOOKUP_URL, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const app = (await res.json())?.results?.[0];
      const value = Number(app?.averageUserRating);
      const count = Number(app?.userRatingCount);
      if (value > 0 && count > 0) rating = { value, count };
    }
  } catch {
    // Geen beoordeling tonen is beter dan een verkeerde.
  }
  cached = { at: Date.now(), rating };
  return rating;
}
