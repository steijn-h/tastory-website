/**
 * App-side deferred deep link handler.
 * Call this once on first launch (after auth is ready, before onboarding completes).
 * Place in your auth/onboarding flow — do NOT add to any existing screen.
 *
 * Requires: expo-clipboard, @supabase/supabase-js
 */
import * as Clipboard from 'expo-clipboard';
import { supabase } from './supabaseClient'; // adjust path

export async function checkQrReferral(userId: string): Promise<void> {
  try {
    // 1. Only run if referral_source not already saved
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_source')
      .eq('id', userId)
      .single();

    if (profile?.referral_source) return; // already set, skip

    // 2. Read clipboard
    const clipText = await Clipboard.getStringAsync();
    if (!clipText.startsWith('ref=')) return;

    const ref = clipText.replace('ref=', '').trim(); // e.g. 'kaartje'

    // 3. Save to profile
    await supabase
      .from('profiles')
      .update({ referral_source: ref })
      .eq('id', userId);

    // 4. Clear clipboard so we don't re-read it
    await Clipboard.setStringAsync('');
  } catch (_) {
    // Non-critical — never block the user flow
  }
}
