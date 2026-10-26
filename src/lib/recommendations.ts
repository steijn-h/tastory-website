// Persoonlijke aanbevelingen, overgenomen uit de app
// (rork-tastory-react/expo/utils/userProfile.ts en
// hooks/usePersonalizedRecommendations.ts): zelfde smaakprofiel, gewichten en
// fases, zodat app en website dezelfde restaurants aanraden. Verschil: de
// website kent de locatie van de gebruiker niet, dus geen nabijheidsbonus.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RestaurantListItem } from './restaurants';

export interface UserPreferenceProfile {
  cuisineWeights: Record<string, number>;
  onboardingCuisineWeights: Record<string, number>;
  behaviorCuisineWeights: Record<string, number>;
  vibeWeights: Record<string, number>;
  priceWeights: Record<number, number>;
  cityWeights: Record<string, number>;
  voorzieningenWeights: Record<string, number>;
  savedCuisines: Set<string>;
  visitedRestaurantIds: Set<string>;
  totalInteractions: number;
  hasData: boolean;
}

interface Preferences {
  preferred_cuisines: string[] | null;
  preferred_vibes: string[] | null;
  preferred_budgets: number[] | null;
  preferred_voorzieningen: string[] | null;
}

type Related = {
  cuisine: string | null;
  vibe: string | null;
  price_level: number | null;
  city: string | null;
};
/** Supabase geeft een gekoppelde rij soms als object, soms als lijst. */
const one = (r: Related | Related[] | null | undefined): Related | null =>
  Array.isArray(r) ? (r[0] ?? null) : (r ?? null);
const split = (value: string | null | undefined) =>
  value ? value.split(',').map((v) => v.trim()) : [];

// Gewichten per gebeurtenis, gelijk aan de app.
const EVENT_WEIGHTS: Record<string, number> = {
  view_restaurant: 1,
  view_restaurant_duration: 2,
  save_restaurant: 4,
  checkin: 5,
  write_review: 4,
  share_restaurant: 3,
  open_menu: 2,
  open_website: 1.5,
  make_reservation: 5,
};

export async function buildUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreferenceProfile> {
  const onboardingCuisineWeights: Record<string, number> = {};
  const behaviorCuisineWeights: Record<string, number> = {};
  const vibeWeights: Record<string, number> = {};
  const priceWeights: Record<number, number> = {};
  const cityWeights: Record<string, number> = {};
  const voorzieningenWeights: Record<string, number> = {};
  const savedRestaurantIds = new Set<string>();
  const savedCuisines = new Set<string>();
  const visitedRestaurantIds = new Set<string>();

  const addW = (map: Record<string, number>, key: string | null | undefined, w: number) => {
    if (!key) return;
    map[key] = (map[key] || 0) + w;
  };
  const addPW = (price: number | null | undefined, w: number) => {
    if (!price) return;
    priceWeights[price] = (priceWeights[price] || 0) + w;
  };

  const RELATED = 'restaurants:restaurant_id(cuisine, vibe, price_level, city)';
  const [prefsRes, behaviorRes, recentViewsRes, visitsRes, savedRes, reviewsRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('preferred_cuisines, preferred_vibes, preferred_budgets, preferred_voorzieningen')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('user_behavior')
        .select('event, restaurant_id, cuisine, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('recent_views')
        .select('restaurant_id, viewed_at')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(50),
      supabase.from('visits').select(`restaurant_id, ${RELATED}`).eq('user_id', userId).limit(50),
      supabase
        .from('saved_restaurants')
        .select(`restaurant_id, ${RELATED}`)
        .eq('user_id', userId)
        .limit(100),
      supabase
        .from('reviews')
        .select(`restaurant_id, rating, ${RELATED}`)
        .eq('user_id', userId)
        .limit(50),
    ]);

  const prefs = (prefsRes.data ?? null) as Preferences | null;
  prefs?.preferred_cuisines?.forEach((c) => addW(onboardingCuisineWeights, c, 1.0));
  prefs?.preferred_vibes?.forEach((v) => addW(vibeWeights, v, 1.5));
  prefs?.preferred_budgets?.forEach((b) => addPW(b, 1.5));
  prefs?.preferred_voorzieningen?.forEach((f) => addW(voorzieningenWeights, f, 1.5));
  const hasOnboardingPrefs =
    (prefs?.preferred_cuisines?.length ?? 0) > 0 || (prefs?.preferred_vibes?.length ?? 0) > 0;

  const behavior = (behaviorRes.data ?? []) as {
    event: string;
    cuisine: string | null;
    metadata: { cuisines?: string[] } | null;
    created_at: string;
  }[];
  const visits = (visitsRes.data ?? []) as unknown as {
    restaurant_id: string;
    restaurants: Related | Related[] | null;
  }[];
  const saved = (savedRes.data ?? []) as unknown as {
    restaurant_id: string;
    restaurants: Related | Related[] | null;
  }[];
  const reviews = (reviewsRes.data ?? []) as unknown as {
    restaurant_id: string;
    rating: number | null;
    restaurants: Related | Related[] | null;
  }[];

  const totalInteractions = behavior.length + visits.length + saved.length + reviews.length;
  const now = Date.now();

  for (const b of behavior) {
    const ageDays = (now - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recency = ageDays < 7 ? 1.5 : ageDays < 30 ? 1.2 : 1.0;
    const baseW = (EVENT_WEIGHTS[b.event] ?? 0.5) * recency;
    split(b.cuisine).forEach((c) => addW(behaviorCuisineWeights, c, baseW));
    if (b.event === 'apply_filter' && Array.isArray(b.metadata?.cuisines)) {
      b.metadata!.cuisines!.forEach((c) => addW(behaviorCuisineWeights, c, 0.5));
    }
  }

  const recentViewIds = ((recentViewsRes.data ?? []) as { restaurant_id: string | null }[])
    .map((v) => v.restaurant_id)
    .filter((id): id is string => Boolean(id));
  if (recentViewIds.length > 0) {
    const { data } = await supabase
      .from('restaurants')
      .select('id, cuisine, vibe, price_level, city')
      .in('id', recentViewIds)
      .limit(50);
    for (const r of (data ?? []) as Related[]) {
      split(r.cuisine).forEach((c) => addW(behaviorCuisineWeights, c, 1.5));
      split(r.vibe).forEach((v) => addW(vibeWeights, v, 1.5));
      addPW(r.price_level, 1);
      addW(cityWeights, r.city, 0.5);
    }
  }

  for (const v of visits) {
    const r = one(v.restaurants);
    if (!r) continue;
    visitedRestaurantIds.add(v.restaurant_id);
    split(r.cuisine).forEach((c) => addW(behaviorCuisineWeights, c, 4));
    split(r.vibe).forEach((vb) => addW(vibeWeights, vb, 3));
    addPW(r.price_level, 3);
    addW(cityWeights, r.city, 2);
  }

  for (const s of saved) {
    savedRestaurantIds.add(s.restaurant_id);
    const r = one(s.restaurants);
    if (!r) continue;
    split(r.cuisine).forEach((c) => {
      addW(behaviorCuisineWeights, c, 1.5);
      savedCuisines.add(c);
    });
    split(r.vibe).forEach((vb) => addW(vibeWeights, vb, 1.0));
    addPW(r.price_level, 1);
    addW(cityWeights, r.city, 0.5);
  }

  for (const rev of reviews) {
    const r = one(rev.restaurants);
    if (!r) continue;
    const ratingMult = rev.rating ? rev.rating / 3 : 1;
    split(r.cuisine).forEach((c) => addW(behaviorCuisineWeights, c, 3 * ratingMult));
    split(r.vibe).forEach((vb) => addW(vibeWeights, vb, 2 * ratingMult));
    addPW(r.price_level, 2 * ratingMult);
    addW(cityWeights, r.city, 1);
  }

  // Onboardingvoorkeur halveren als er na 10+ interacties niets mee gedaan is.
  if (totalInteractions >= 10) {
    for (const cuisine of Object.keys(onboardingCuisineWeights)) {
      if (!behaviorCuisineWeights[cuisine]) onboardingCuisineWeights[cuisine] *= 0.5;
    }
  }

  const cuisineWeights: Record<string, number> = { ...onboardingCuisineWeights };
  for (const [k, v] of Object.entries(behaviorCuisineWeights))
    cuisineWeights[k] = (cuisineWeights[k] || 0) + v;

  const hasBehavior =
    visitedRestaurantIds.size > 0 || savedRestaurantIds.size > 0 || behavior.length > 5;

  return {
    cuisineWeights,
    onboardingCuisineWeights,
    behaviorCuisineWeights,
    vibeWeights,
    priceWeights,
    cityWeights,
    voorzieningenWeights,
    savedCuisines,
    visitedRestaurantIds,
    totalInteractions,
    hasData: hasBehavior || hasOnboardingPrefs,
  };
}

/** Gelijk aan scoreRestaurantForUser in de app, zonder locatie. */
export function scoreRestaurantForUser(
  restaurant: RestaurantListItem,
  profile: UserPreferenceProfile,
): number {
  if (!profile.hasData) return restaurant.weighted_score ?? 0;

  let score = 0;
  // Fase 1: nieuw (0–4), fase 2: groeiend (5–19), fase 3: ervaren (20+).
  const phase = profile.totalInteractions < 5 ? 1 : profile.totalInteractions < 20 ? 2 : 3;
  const behaviorMult = phase === 1 ? 0.5 : phase === 2 ? 1.0 : 1.5;

  for (const key of split(restaurant.cuisine)) {
    if (phase === 1) {
      score += (profile.onboardingCuisineWeights[key] ?? 0) * 8;
      score += (profile.behaviorCuisineWeights[key] ?? 0) * 5 * behaviorMult;
    } else if (phase === 2) {
      score += (profile.cuisineWeights[key] ?? 0) * 5;
    } else {
      score += (profile.onboardingCuisineWeights[key] ?? 0) * 3;
      score += (profile.behaviorCuisineWeights[key] ?? 0) * 7;
    }
    if (profile.savedCuisines.has(key)) score += 3;
  }
  for (const v of split(restaurant.vibe))
    score += (profile.vibeWeights[v] ?? 0) * 1.5 * behaviorMult;
  score += (profile.priceWeights[restaurant.price_level ?? 0] ?? 0) * 1.2 * behaviorMult;
  score += (profile.cityWeights[restaurant.city ?? ''] ?? 0) * 0.8 * behaviorMult;
  if (restaurant.facilities?.length && Object.keys(profile.voorzieningenWeights).length > 0) {
    for (const f of restaurant.facilities) score += (profile.voorzieningenWeights[f] ?? 0) * 1.0;
  }
  score += (restaurant.weighted_score ?? 0) * 0.5;
  if (profile.visitedRestaurantIds.has(restaurant.id)) score *= 0.6;
  return score;
}

/** Top-N aanbevelingen; leeg als er (nog) geen smaakprofiel is. */
export function recommend(
  restaurants: RestaurantListItem[],
  profile: UserPreferenceProfile,
  limit = 10,
): RestaurantListItem[] {
  if (!profile.hasData) return [];
  return restaurants
    .map((r) => ({ r, score: scoreRestaurantForUser(r, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.r);
}
