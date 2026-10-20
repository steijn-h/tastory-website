// Acties van een ingelogde gebruiker in de browser: profiel, opslaan en
// collecties. De queries zijn gelijk aan die in de app (rork-tastory-react),
// zodat app en website dezelfde gegevens lezen en schrijven.
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface OwnProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_banned: boolean | null;
  ban_reason: string | null;
}

export interface Collectie {
  id: string;
  naam: string | null;
  kleur: string | null;
}

// Zelfde kleuren als SaveToCollectionSheet in de app.
export const COLLECTIE_COLORS = [
  '#E8612A',
  '#E85D9A',
  '#7F77DD',
  '#3B9E75',
  '#378ADD',
  '#E8912A',
  '#C9A84C',
  '#E24B4A',
  '#6B5B3E',
];

const PROFILE_COLUMNS = 'id, username, full_name, avatar_url, is_banned, ban_reason';

/** Namen die social login als tijdelijke naam achterlaat (zie AuthProvider). */
function isPlaceholderName(name: string | null | undefined): boolean {
  const trimmed = name?.trim() ?? '';
  return !trimmed || trimmed === 'Foodie' || trimmed.toLowerCase() === 'user';
}

export function profileNeedsName(profile: OwnProfile): boolean {
  return isPlaceholderName(profile.full_name) || !profile.username?.trim();
}

/** Gebruikersnaam zoals de app hem toestaat (onboarding). */
export function sanitizeUsername(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 30);
}

export type ProfileResult =
  | { status: 'ok'; profile: OwnProfile }
  | { status: 'banned'; reason: string | null }
  | { status: 'error'; message: string };

/**
 * Profiel na het inloggen. Normaal maakt een databasetrigger het profiel aan;
 * net als de app maken we het zelf aan als het (nog) ontbreekt.
 */
export async function loadOwnProfile(supabase: SupabaseClient, user: User): Promise<ProfileResult> {
  let { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (!error && !data) {
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = String(metadata.full_name || metadata.name || '').trim() || null;
    const avatarUrl = String(metadata.avatar_url || '').trim() || null;
    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, full_name: fullName, avatar_url: avatarUrl },
        { onConflict: 'id', ignoreDuplicates: true },
      );
    ({ data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .maybeSingle());
  }

  if (error || !data) {
    return { status: 'error', message: 'Je profiel kon niet geladen worden. Probeer het opnieuw.' };
  }
  const profile = data as OwnProfile;
  if (profile.is_banned) {
    await supabase.auth.signOut();
    return { status: 'banned', reason: profile.ban_reason };
  }
  return { status: 'ok', profile };
}

export async function isUsernameTaken(
  supabase: SupabaseClient,
  username: string,
  ownId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', ownId)
    .maybeSingle();
  return Boolean(data);
}

export async function saveName(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
  username: string,
): Promise<string | null> {
  if (await isUsernameTaken(supabase, username, userId)) {
    return 'Deze gebruikersnaam is al in gebruik. Kies een andere.';
  }
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, username })
    .eq('id', userId);
  if (error) {
    return error.code === '23505'
      ? 'Deze gebruikersnaam is al in gebruik. Kies een andere.'
      : 'Opslaan is niet gelukt. Probeer het opnieuw.';
  }
  return null;
}

// ── Opslaan ────────────────────────────────────────────────────────────────

export async function isRestaurantSaved(
  supabase: SupabaseClient,
  userId: string,
  restaurantId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('saved_restaurants')
    .select('restaurant_id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();
  return Boolean(data);
}

export async function listCollecties(
  supabase: SupabaseClient,
  userId: string,
): Promise<Collectie[]> {
  const { data, error } = await supabase
    .from('collecties')
    .select('id, naam, kleur')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Je collecties konden niet geladen worden.');
  return (data ?? []) as Collectie[];
}

export async function createCollectie(
  supabase: SupabaseClient,
  userId: string,
  naam: string,
  kleur: string,
): Promise<Collectie> {
  const { data, error } = await supabase
    .from('collecties')
    .insert({ naam, user_id: userId, kleur })
    .select('id, naam, kleur')
    .single();
  if (error || !data) throw new Error('Kon de collectie niet aanmaken.');
  return data as Collectie;
}

/** Zelfde als saveMutation in SaveToCollectionSheet (app). */
export async function saveRestaurant(
  supabase: SupabaseClient,
  userId: string,
  restaurantId: string,
  options: { cuisine?: string | null; collectieId?: string | null; note?: string | null },
): Promise<void> {
  const { error } = await supabase.from('saved_restaurants').upsert(
    {
      user_id: userId,
      restaurant_id: restaurantId,
      cuisine: options.cuisine || '',
      notes: options.note?.trim() || null,
    },
    { onConflict: 'user_id,restaurant_id' },
  );
  if (error) throw new Error('Kon het restaurant niet opslaan.');

  if (options.collectieId) {
    const { error: linkError } = await supabase
      .from('collectie_restaurants')
      .upsert(
        { collectie_id: options.collectieId, restaurant_id: restaurantId, user_id: userId },
        { onConflict: 'collectie_id,restaurant_id' },
      );
    if (linkError) throw new Error('Opgeslagen, maar niet aan de collectie toegevoegd.');
  }
}

/** Zelfde als handleRemove in SavedRestaurantActionsSheet (app). */
export async function removeSavedRestaurant(
  supabase: SupabaseClient,
  userId: string,
  restaurantId: string,
): Promise<void> {
  await supabase
    .from('collectie_restaurants')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);
  const { error } = await supabase
    .from('saved_restaurants')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);
  if (error) throw new Error('Kon het restaurant niet verwijderen.');
}
