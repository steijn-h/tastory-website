// Review ("ervaring") plaatsen vanaf de website. Overgenomen uit ReviewSheet
// in de app (rork-tastory-react/expo/components/ReviewSheet.tsx): dezelfde
// controles, gewichten en status, zodat een review via de website precies zo
// behandeld wordt als een review uit de app.
//
// Eén bewust verschil: geen GPS check-in. In een browser is je locatie met de
// ontwikkelaarstools in een paar seconden te vervalsen; een "geverifieerde"
// review van de website zou dus niets bewijzen. Reviews via de website zijn
// daarom altijd UNVERIFIED (laag gewicht, pas zichtbaar na consensus).
// Verifiëren kan in de app.
import type { SupabaseClient } from '@supabase/supabase-js';

type VerificationTier = 'VERIFIED' | 'SEMI' | 'UNVERIFIED' | 'FLAGGED';

export const MIN_REVIEW_LENGTH = 10;
export const MAX_REVIEW_LENGTH = 500;
const MIN_DAYS_BETWEEN_VISITS = 14;

export interface ReviewInput {
  restaurantId: string;
  text: string;
  service: number;
  quality: number;
  speed: number;
  experience: number;
  price: number;
  ambiance: number;
}

function getScoreWeight(tier: VerificationTier, accountTrust: number): number {
  const trustMultiplier = 0.4 + accountTrust * 0.6;
  if (tier === 'VERIFIED') return 0.75 * trustMultiplier;
  if (tier === 'SEMI') return 0.75 * trustMultiplier;
  if (tier === 'UNVERIFIED') return 0.25 * trustMultiplier;
  return 0;
}

function calculateAccountTrust(
  accountAgeDays: number,
  totalReviews: number,
  consensusRatio: number,
): number {
  const ageScore = Math.min(accountAgeDays / 180, 1.0);
  const volumeScore = Math.min(totalReviews / 20, 1.0);
  const consensusScore = totalReviews > 0 ? consensusRatio : 0.5;
  return ageScore * 0.3 + volumeScore * 0.3 + consensusScore * 0.4;
}

async function getAccountTrust(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();
    const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const { data: history } = await supabase
      .from('reviews')
      .select('id, status')
      .eq('user_id', userId)
      .limit(50);
    const total = history?.length ?? 0;
    const published = history?.filter((r) => r.status === 'published').length ?? 0;
    const consensusRatio = total > 0 ? published / total : 0.5;
    return calculateAccountTrust(ageDays, total, consensusRatio);
  } catch {
    return 0.5;
  }
}

/**
 * Apparaat-id voor de misbruikcontrole. In de app afgeleid van het toestel;
 * op de website een willekeurige id die in de browser bewaard blijft.
 */
function getDeviceId(): string {
  const key = 'tastory_device_id';
  try {
    const cached = localStorage.getItem(key);
    if (cached) return cached;
    const id = `w_${crypto.randomUUID()}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `w_${crypto.randomUUID()}`;
  }
}

async function isDeviceBlocked(
  supabase: SupabaseClient,
  restaurantId: string,
  deviceId: string,
): Promise<{ blocked: boolean; reason: string | null }> {
  try {
    const { data } = await supabase
      .from('reviews')
      .select('id, user_id, gps_checked_in')
      .eq('restaurant_id', restaurantId)
      .eq('device_id', deviceId)
      .neq('status', 'flagged')
      .limit(5);
    if (!data || data.length === 0) return { blocked: false, reason: null };
    if (data.every((r) => r.gps_checked_in)) return { blocked: false, reason: null };
    return {
      blocked: true,
      reason: `Device has non-GPS review: device_id=${deviceId}, reviews=${data.length}`,
    };
  } catch {
    return { blocked: false, reason: null };
  }
}

interface RecentReview {
  created_at: string | null;
  user_id: string;
  device_id?: string | null;
}

function isVelocityFlagged(recent: RecentReview[]): { flagged: boolean; reason: string | null } {
  const now = Date.now();
  const MS_HOUR = 60 * 60 * 1000;
  const MS_DAY = 24 * MS_HOUR;
  const MS_WEEK = 7 * MS_DAY;
  const BURST_MULTIPLIER = 4;
  const HOURLY_FLOOR = 10;
  const DAILY_FLOOR = 30;
  const age = (r: RecentReview) =>
    r.created_at ? now - new Date(r.created_at).getTime() : Infinity;

  const inLastHour = recent.filter((r) => age(r) < MS_HOUR);
  const inLastDay = recent.filter((r) => age(r) < MS_DAY);
  const historicalDays = recent.filter((r) => age(r) < MS_WEEK && age(r) >= MS_DAY);

  const baselineHourly = historicalDays.length / 144;
  const baselineDaily = historicalDays.length / 6;
  const hourlyThreshold = Math.max(HOURLY_FLOOR, Math.ceil(baselineHourly * BURST_MULTIPLIER));
  const dailyThreshold = Math.max(DAILY_FLOOR, Math.ceil(baselineDaily * BURST_MULTIPLIER));

  if (inLastHour.length >= hourlyThreshold) {
    return {
      flagged: true,
      reason: `Hourly burst: ${inLastHour.length} reviews in last hour (threshold: ${hourlyThreshold}, baseline: ${baselineHourly.toFixed(1)}/hr)`,
    };
  }
  if (inLastDay.length >= dailyThreshold) {
    return {
      flagged: true,
      reason: `Daily burst: ${inLastDay.length} reviews in last 24h (threshold: ${dailyThreshold}, baseline: ${baselineDaily.toFixed(1)}/day)`,
    };
  }
  if (inLastHour.length >= 6) {
    const uniqueUsers = new Set(inLastHour.map((r) => r.user_id).filter(Boolean));
    const uniqueDevices = new Set(inLastHour.map((r) => r.device_id).filter(Boolean));
    if (uniqueUsers.size < inLastHour.length * 0.6) {
      return {
        flagged: true,
        reason: `Duplicate user burst: ${inLastHour.length} reviews from only ${uniqueUsers.size} unique users in last hour`,
      };
    }
    if (uniqueDevices.size > 0 && uniqueDevices.size < inLastHour.length * 0.7) {
      return {
        flagged: true,
        reason: `Duplicate device burst: ${inLastHour.length} reviews from only ${uniqueDevices.size} unique devices in last hour`,
      };
    }
  }
  return { flagged: false, reason: null };
}

function logBehavior(
  supabase: SupabaseClient,
  userId: string,
  event: string,
  restaurantId: string,
  reason: string,
): void {
  void supabase
    .from('user_behavior')
    .insert({
      user_id: userId,
      event,
      restaurant_id: restaurantId,
      metadata: { reason, source: 'website' },
      created_at: new Date().toISOString(),
    })
    .then(
      () => {},
      () => {},
    );
}

/**
 * Wanneer mag deze gebruiker weer een review schrijven? null = nu.
 * Zonder GPS (website) is een tweede review voor hetzelfde restaurant niet
 * mogelijk: de app vraagt dan een GPS check-in.
 */
export async function checkCanReview(
  supabase: SupabaseClient,
  userId: string,
  restaurantId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data } = await supabase
    .from('reviews')
    .select('id, created_at, status')
    .eq('restaurant_id', restaurantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  const previous = (data ?? []).filter((r) => r.status !== 'flagged');
  if (previous.length === 0) return { ok: true };

  const daysSinceLast =
    (Date.now() - new Date(previous[0].created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLast < MIN_DAYS_BETWEEN_VISITS) {
    const daysLeft = Math.ceil(MIN_DAYS_BETWEEN_VISITS - daysSinceLast);
    return {
      ok: false,
      message: `Je hebt hier onlangs al een review geschreven. Over ${daysLeft} dag${daysLeft === 1 ? '' : 'en'} kun je na een nieuw bezoek weer een review delen.`,
    };
  }
  return {
    ok: false,
    message:
      'Je hebt hier eerder een review geschreven. Een review van een nieuw bezoek plaats je in de Tastory-app, met een GPS check-in in het restaurant.',
  };
}

export type SubmitResult = { ok: true } | { ok: false; message: string };

export async function submitReview(
  supabase: SupabaseClient,
  userId: string,
  input: ReviewInput,
): Promise<SubmitResult> {
  const subRatings = [
    input.service,
    input.quality,
    input.speed,
    input.experience,
    input.price,
    input.ambiance,
  ];
  const ratings = subRatings.filter((r) => r > 0);
  const text = input.text.trim();
  if (ratings.length === 0)
    return { ok: false, message: 'Geef minstens één beoordeling met sterren.' };
  if (text.length < MIN_REVIEW_LENGTH) {
    return { ok: false, message: `Schrijf minstens ${MIN_REVIEW_LENGTH} tekens over je ervaring.` };
  }
  if (text.length > MAX_REVIEW_LENGTH) {
    return { ok: false, message: `Je review mag maximaal ${MAX_REVIEW_LENGTH} tekens zijn.` };
  }

  const allowed = await checkCanReview(supabase, userId, input.restaurantId);
  if (!allowed.ok) return allowed;

  const deviceId = getDeviceId();
  const overallRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  const device = await isDeviceBlocked(supabase, input.restaurantId, deviceId);
  if (device.blocked) {
    // Zoals de app: stil als 'flagged' en privé opslaan, de gebruiker ziet
    // dezelfde bevestiging.
    await supabase
      .from('reviews')
      .insert({
        restaurant_id: input.restaurantId,
        user_id: userId,
        rating: overallRating,
        weighted_rating: 0,
        text,
        status: 'flagged',
        gps_checked_in: false,
        photo_verified: false,
        verification_tier: 'FLAGGED',
        score_weight: 0,
        device_id: deviceId,
        is_private: true,
      })
      .then(
        () => {},
        () => {},
      );
    logBehavior(supabase, userId, 'review_device_blocked', input.restaurantId, device.reason ?? '');
    return { ok: true };
  }

  const { data: recent } = await supabase
    .from('reviews')
    .select('created_at, user_id, device_id')
    .eq('restaurant_id', input.restaurantId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(500);
  const velocity = isVelocityFlagged((recent ?? []) as RecentReview[]);
  if (velocity.flagged && velocity.reason) {
    logBehavior(supabase, userId, 'review_velocity_flagged', input.restaurantId, velocity.reason);
  }

  const accountTrust = await getAccountTrust(supabase, userId);
  const tier: VerificationTier = velocity.flagged ? 'FLAGGED' : 'UNVERIFIED';
  const weight = getScoreWeight(tier, accountTrust);
  // Tekstbonus geldt in de app alleen voor VERIFIED; hier dus 0.
  const subVariance = ratings.length >= 3 ? 0.05 : 0;
  const weightedRating = Math.min(5, overallRating + subVariance);

  const { error } = await supabase.from('reviews').insert({
    restaurant_id: input.restaurantId,
    user_id: userId,
    rating: overallRating,
    weighted_rating: weightedRating,
    text,
    status: velocity.flagged ? 'flagged' : 'pending',
    gps_checked_in: false,
    photo_verified: false,
    verification_tier: tier,
    score_weight: weight,
    account_trust_score: accountTrust,
    service_rating: input.service || null,
    quality_rating: input.quality || null,
    speed_rating: input.speed || null,
    experience_rating: input.experience || null,
    price_rating: input.price || null,
    ambiance_rating: input.ambiance || null,
    is_private: false,
    device_id: deviceId,
  });
  if (error) {
    console.error('[review] insert', error.code, error.message);
    if (error.code === '42501' || /row-level security|permission denied/i.test(error.message)) {
      return {
        ok: false,
        message: 'Je sessie is verlopen. Log opnieuw in en probeer het nogmaals.',
      };
    }
    return { ok: false, message: 'Je review kon niet geplaatst worden. Probeer het opnieuw.' };
  }

  if (!velocity.flagged) {
    // Publiceert reviews zodra er genoeg bevestiging is (zelfde RPC als de app).
    const { error: rpcError } = await supabase.rpc('check_and_publish_reviews', {
      p_restaurant_id: input.restaurantId,
    });
    if (rpcError) console.error('[review] check_and_publish_reviews', rpcError.message);
  }
  return { ok: true };
}
