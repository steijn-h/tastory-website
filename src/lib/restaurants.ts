// Data-toegang voor de restaurantpagina's. De filters zijn bewust gelijk aan
// die van de app (rork-tastory-react), zodat gasten op de website precies zien
// wat ze in de app als gast ook zien.
import { getSupabase } from './supabase';
import { normalizeCity, safeHttpsUrl, slugify } from './format';

export interface Restaurant {
  id: string;
  name: string | null;
  slug: string | null;
  cuisine: string | null;
  vibe: string | null;
  price_level: number | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  facilities: string[] | null;
  allergie_keuze: string[] | null;
  opening_hours: string | null;
  photo_url: string | null;
  menukaart_url: string | null;
  background_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  menuknop_kleur: string | null;
  video_url: string | null;
  Reserveer_url: string | null;
  reservering_url: string | null;
  weighted_score: number | null;
  published_review_count: number | null;
  created_at: string | null;
}

/** Lichte variant voor lijsten, kaarten en stadspagina's. */
export type RestaurantListItem = Pick<
  Restaurant,
  | 'id'
  | 'name'
  | 'slug'
  | 'photo_url'
  | 'city'
  | 'cuisine'
  | 'vibe'
  | 'price_level'
  | 'weighted_score'
  | 'published_review_count'
  | 'lat'
  | 'lng'
  | 'video_url'
  | 'background_url'
>;

// Zelfde kolommen als de detailquery in de app (RestaurantDetailScreen).
const DETAIL_COLUMNS = [
  'id',
  'name',
  'slug',
  'cuisine',
  'vibe',
  'price_level',
  'city',
  'address',
  'lat',
  'lng',
  'description',
  'website',
  'phone',
  'email',
  'facilities',
  'allergie_keuze',
  'opening_hours',
  'photo_url',
  'menukaart_url',
  'background_url',
  'instagram_url',
  'facebook_url',
  'menuknop_kleur',
  'video_url',
  'Reserveer_url',
  'reservering_url',
  'weighted_score',
  'published_review_count',
  'created_at',
].join(',');

const LIST_COLUMNS =
  'id,name,slug,photo_url,city,cuisine,vibe,price_level,weighted_score,published_review_count,lat,lng,video_url,background_url';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Partner = heeft video of eigen achtergrond (zelfde regel als de app). */
export function isPartnerRestaurant(r: Pick<Restaurant, 'video_url' | 'background_url'>): boolean {
  return Boolean(r.video_url || r.background_url);
}

/**
 * Geldige video (https-link). Zelfde idee als de video-sectie in de app, maar
 * strenger: een mapnaam of kapotte waarde in video_url telt niet mee.
 */
export function hasVideo(r: Pick<Restaurant, 'video_url'>): boolean {
  return safeHttpsUrl(r.video_url) !== null;
}

export function restaurantPath(r: Pick<Restaurant, 'id' | 'slug'>): string {
  return `/restaurant/${r.slug || r.id}`;
}

export function cityPath(city: string): string {
  return `/restaurants/${slugify(city)}`;
}

export type LookupResult =
  | { status: 'ok'; restaurant: Restaurant }
  | { status: 'not-found' }
  | { status: 'error' };

/** Zoekt op slug, of op id (oude deellinks uit de app gebruiken het id). */
export async function getRestaurant(param: string): Promise<LookupResult> {
  const supabase = getSupabase();
  if (!supabase) return { status: 'error' };
  const { data, error } = await supabase
    .from('restaurants')
    .select(DETAIL_COLUMNS)
    .eq(isUuid(param) ? 'id' : 'slug', param)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[restaurants] getRestaurant', param, error.message);
    return { status: 'error' };
  }
  if (!data) return { status: 'not-found' };
  return { status: 'ok', restaurant: data as unknown as Restaurant };
}

// Alle restaurants (licht) — gebruikt door overzicht, stadspagina's en
// "meer in de buurt". Kort in het geheugen van de serverfunctie bewaard.
let listCache: { at: number; rows: RestaurantListItem[] } | null = null;
const LIST_TTL_MS = 5 * 60 * 1000;

export async function getAllRestaurants(): Promise<RestaurantListItem[] | null> {
  if (listCache && Date.now() - listCache.at < LIST_TTL_MS) return listCache.rows;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('restaurants')
    .select(LIST_COLUMNS)
    .order('weighted_score', { ascending: false, nullsFirst: false })
    .limit(1000);
  if (error) {
    console.error('[restaurants] getAllRestaurants', error.message);
    return listCache?.rows ?? null;
  }
  const rows = (data ?? []) as unknown as RestaurantListItem[];
  listCache = { at: Date.now(), rows };
  return rows;
}

/** Lichte gegevens voor een lijst id's (bijv. opgeslagen restaurants). */
export async function getRestaurantsByIds(ids: string[]): Promise<RestaurantListItem[]> {
  const unique = [...new Set(ids)].filter(isUuid);
  const supabase = getSupabase();
  if (!supabase || unique.length === 0) return [];
  const { data, error } = await supabase.from('restaurants').select(LIST_COLUMNS).in('id', unique);
  if (error) {
    console.error('[restaurants] getRestaurantsByIds', error.message);
    return [];
  }
  return (data ?? []) as unknown as RestaurantListItem[];
}

export interface CityGroup {
  name: string;
  slug: string;
  restaurants: RestaurantListItem[];
}

export function groupByCity(rows: RestaurantListItem[]): CityGroup[] {
  const map = new Map<string, CityGroup>();
  for (const r of rows) {
    const name = normalizeCity(r.city);
    if (!name) continue;
    const slug = slugify(name);
    if (!slug) continue;
    const group = map.get(slug) ?? { name, slug, restaurants: [] };
    group.restaurants.push(r);
    map.set(slug, group);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
}

// ── Reviews ────────────────────────────────────────────────────────────────

export const ASPECTS = [
  { key: 'service_rating', label: 'Service' },
  { key: 'quality_rating', label: 'Kwaliteit' },
  { key: 'speed_rating', label: 'Snelheid' },
  { key: 'experience_rating', label: 'Ervaring' },
  { key: 'price_rating', label: 'Prijs-kwaliteit' },
  { key: 'ambiance_rating', label: 'Sfeer' },
] as const;

export type AspectKey = (typeof ASPECTS)[number]['key'];

export interface Review {
  id: string;
  user_id: string | null;
  rating: number | null;
  text: string | null;
  created_at: string | null;
  gps_checked_in: boolean | null;
  photo_verified: boolean | null;
  verification_tier: 'VERIFIED' | 'SEMI' | 'UNVERIFIED' | 'FLAGGED' | null;
  service_rating: number | null;
  quality_rating: number | null;
  speed_rating: number | null;
  experience_rating: number | null;
  price_rating: number | null;
  ambiance_rating: number | null;
  author: ReviewAuthor;
}

export interface ReviewAuthor {
  name: string;
  avatarUrl: string | null;
  initial: string;
}

const REVIEW_COLUMNS = [
  'id',
  'user_id',
  'rating',
  'text',
  'created_at',
  'gps_checked_in',
  'photo_verified',
  'verification_tier',
  ...ASPECTS.map((a) => a.key),
].join(',');

interface PublicProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Naam op een openbare (door Google te vinden) pagina: @gebruikersnaam zoals in
 * de app, en anders alleen de voornaam — nooit de volledige naam.
 */
function authorFromProfile(profile: PublicProfile | undefined): ReviewAuthor {
  const username = profile?.username?.trim();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const name = username ? `@${username}` : firstName || 'Tastory-gast';
  const initial = (username || firstName || 'T').charAt(0).toUpperCase();
  return { name, avatarUrl: profile?.avatar_url || null, initial };
}

async function fetchProfiles(userIds: string[]): Promise<Map<string, PublicProfile>> {
  const map = new Map<string, PublicProfile>();
  const ids = [...new Set(userIds)].filter(Boolean);
  const supabase = getSupabase();
  if (!supabase || ids.length === 0) return map;
  // profiles_public is de openbare profielweergave die de app ook gebruikt.
  const { data, error } = await supabase
    .from('profiles_public')
    .select('id, username, full_name, avatar_url')
    .in('id', ids);
  if (error) {
    console.error('[restaurants] fetchProfiles', error.message);
    return map;
  }
  for (const p of (data ?? []) as PublicProfile[]) map.set(p.id, p);
  return map;
}

export interface ReviewPage {
  reviews: Review[];
  hasMore: boolean;
}

export const REVIEWS_PAGE_SIZE = 10;

export async function getReviews(
  restaurantId: string,
  offset = 0,
  limit = REVIEWS_PAGE_SIZE,
): Promise<ReviewPage | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  // Eén extra rij ophalen om te weten of er nog meer zijn.
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('restaurant_id', restaurantId)
    .eq('status', 'published')
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);
  if (error) {
    console.error('[restaurants] getReviews', restaurantId, error.message);
    return null;
  }
  const rows = (data ?? []) as unknown as Omit<Review, 'author'>[];
  const page = rows.slice(0, limit);
  const profiles = await fetchProfiles(page.map((r) => r.user_id ?? ''));
  return {
    reviews: page.map((r) => ({ ...r, author: authorFromProfile(profiles.get(r.user_id ?? '')) })),
    hasMore: rows.length > limit,
  };
}

export interface ReviewStats {
  count: number;
  /** Aantal reviews per aantal sterren (index 0 = 1 ster ... 4 = 5 sterren). */
  distribution: [number, number, number, number, number];
  aspects: { key: AspectKey; label: string; average: number | null; count: number }[];
}

export async function getReviewStats(restaurantId: string): Promise<ReviewStats | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('reviews')
    .select(['rating', ...ASPECTS.map((a) => a.key)].join(','))
    .eq('restaurant_id', restaurantId)
    .eq('status', 'published')
    .eq('is_private', false)
    .limit(5000);
  if (error) {
    console.error('[restaurants] getReviewStats', restaurantId, error.message);
    return null;
  }
  const rows = (data ?? []) as unknown as Record<string, number | null>[];
  const distribution: ReviewStats['distribution'] = [0, 0, 0, 0, 0];
  for (const row of rows) {
    const rating = Math.round(row.rating ?? 0);
    if (rating >= 1 && rating <= 5) distribution[rating - 1] += 1;
  }
  const aspects = ASPECTS.map(({ key, label }) => {
    const values = rows
      .map((row) => row[key])
      .filter((v): v is number => typeof v === 'number' && v > 0);
    const average =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null;
    return { key, label, average, count: values.length };
  });
  return { count: rows.length, distribution, aspects };
}

// ── Stories ────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  photo_url: string | null;
  caption: string | null;
  created_at: string | null;
  author: ReviewAuthor;
}

export async function getStories(restaurantId: string, limit = 12): Promise<Story[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('stories')
    .select('id, user_id, photo_url, caption, created_at')
    .eq('restaurant_id', restaurantId)
    .eq('visibility', 'public')
    .neq('status', 'flagged')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[restaurants] getStories', restaurantId, error.message);
    return [];
  }
  const rows = (data ?? []) as {
    id: string;
    user_id: string | null;
    photo_url: string | null;
    caption: string | null;
    created_at: string | null;
  }[];
  const withPhoto = rows.filter((s) => s.photo_url);
  const profiles = await fetchProfiles(withPhoto.map((s) => s.user_id ?? ''));
  return withPhoto.map((s) => ({
    id: s.id,
    photo_url: s.photo_url,
    caption: s.caption,
    created_at: s.created_at,
    author: authorFromProfile(profiles.get(s.user_id ?? '')),
  }));
}
