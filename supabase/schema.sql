-- Ben Fight — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  real_name text not null,
  fight_name text not null,
  height_in integer not null,          -- store inches; format for display client-side
  weight_lbs integer not null,
  nationality text not null,
  avatar_url text,
  balance numeric(12, 2) not null default 100.00,
  wins integer not null default 0,
  losses integer not null default 0,
  fights_demanded integer not null default 0,
  fights_accepted integer not null default 0,
  fights_rejected integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by all authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- FIGHTS
-- ============================================================
create type fight_status as enum ('pending', 'active', 'vetoed', 'resolved');

create table if not exists public.fights (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  challenged_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,                 -- e.g. "Disrespect at Weigh-In"
  status fight_status not null default 'pending',
  winner_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.fights enable row level security;

create policy "Fights are viewable by all authenticated users"
  on public.fights for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create fights"
  on public.fights for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update fights"
  on public.fights for update
  using (auth.role() = 'authenticated');

-- ============================================================
-- VOTES  (authorize combat / show mercy / veto yes-no)
-- ============================================================
create type vote_choice as enum ('authorize', 'mercy');

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  choice vote_choice not null,
  created_at timestamptz not null default now(),
  unique (fight_id, voter_id)
);

alter table public.votes enable row level security;

create policy "Votes are viewable by all authenticated users"
  on public.votes for select
  using (auth.role() = 'authenticated');

create policy "Users can cast their own vote"
  on public.votes for insert
  with check (auth.uid() = voter_id);

create policy "Users can change their own vote"
  on public.votes for update
  using (auth.uid() = voter_id);

-- ============================================================
-- BETS
-- ============================================================
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  bettor_id uuid not null references public.profiles(id) on delete cascade,
  fighter_id uuid not null references public.profiles(id), -- who they bet on
  amount numeric(12, 2) not null check (amount > 0),
  odds_at_bet numeric(6, 2) not null,   -- decimal odds snapshot at bet time
  payout numeric(12, 2),                -- filled in on resolution
  created_at timestamptz not null default now()
);

alter table public.bets enable row level security;

create policy "Bets are viewable by all authenticated users"
  on public.bets for select
  using (auth.role() = 'authenticated');

create policy "Users can place their own bets"
  on public.bets for insert
  with check (auth.uid() = bettor_id);

-- ============================================================
-- STORAGE: avatars bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- PROFILES: avatar color for default silhouette avatars
-- ============================================================
alter table public.profiles
  add column if not exists avatar_color text not null default '#FF6B6B';

-- ============================================================
-- HELPFUL VIEW: community favorite tally per fight
-- ============================================================
create or replace view public.fight_vote_tallies as
select
  fight_id,
  count(*) filter (where choice = 'authorize') as authorize_count,
  count(*) filter (where choice = 'mercy') as mercy_count
from public.votes
group by fight_id;

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.fights;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.profiles;
