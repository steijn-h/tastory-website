-- Add referral_source column to profiles table
-- Used by the app to record how the user first installed (e.g. 'kaartje')
alter table public.profiles
  add column if not exists referral_source text;
