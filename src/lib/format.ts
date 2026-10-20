// Kleine opmaak-helpers, gelijk aan de logica in de app
// (rork-tastory-react/expo/components/RestaurantDetailScreen.tsx).

export function priceLabel(level: number | null | undefined): string {
  return '€'.repeat(Math.max(1, Math.min(level ?? 1, 4)));
}

/** photo_url / menukaart_url zijn komma-gescheiden lijsten met URL's. */
export function splitUrls(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.avif', '.svg'];

export function isImageUrl(url: string): boolean {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/** Alleen https-links openen (zelfde regel als de app voor reserveren). */
export function safeHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Websites worden soms zonder https:// ingevoerd. */
export function normalizeWebsite(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export interface OpeningHoursRow {
  day: string;
  time: string;
}

/**
 * Openingstijden staan als tekst opgeslagen, meestal
 * "Maandag: 12:00–22:00 | Dinsdag: ..." — soms met regeleinden of komma's.
 */
export function parseOpeningHours(value: string | null | undefined): OpeningHoursRow[] {
  if (!value) return [];
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.includes('\n')
    ? normalized.split('\n')
    : normalized.includes('|')
      ? normalized.split('|')
      : normalized.split(',');
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return { day: line, time: '' };
      return { day: line.slice(0, colonIndex).trim(), time: line.slice(colonIndex + 1).trim() };
    });
}

const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

/** Naam van vandaag in Nederland (de server draait in UTC). */
export function todayDutch(): string {
  const name = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', timeZone: 'Europe/Amsterdam' })
    .format(new Date())
    .toLowerCase();
  return DAY_NAMES.includes(name) ? name : '';
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatReviewDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Amsterdam',
  });
}

/** "Den Haag" -> "den-haag", "'s-Hertogenbosch" -> "s-hertogenbosch". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CITY_ALIASES: Record<string, string> = {
  'oud ootmarsum': 'Ootmarsum',
};

/** Zelfde normalisatie als de bestaande /restaurants-pagina. */
export function normalizeCity(city: string | null | undefined): string | null {
  if (!city) return null;
  const lower = city.toLowerCase().trim();
  if (!lower) return null;
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];
  return city
    .trim()
    .replace(/(^|[\s-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
