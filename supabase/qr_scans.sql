-- QR scan tracking table
-- Created for tastory.nl/download QR card landing page
create table if not exists public.qr_scans (
  id          bigint generated always as identity primary key,
  platform    text        not null check (platform in ('ios', 'android', 'desktop')),
  ref         text        not null default 'kaartje',
  user_agent  text,
  timestamp   timestamptz not null default now()
);

-- Enable RLS; allow anon inserts (landing page uses anon key)
alter table public.qr_scans enable row level security;

create policy "anon can insert qr_scans"
  on public.qr_scans for insert
  to anon
  with check (true);

-- Android waitlist (collected on the Android waiting screen)
create table if not exists public.android_waitlist (
  id           bigint generated always as identity primary key,
  email        text        not null,
  ref          text        not null default 'kaartje',
  signed_up_at timestamptz not null default now()
);

alter table public.android_waitlist enable row level security;

create policy "anon can insert android_waitlist"
  on public.android_waitlist for insert
  to anon
  with check (true);
