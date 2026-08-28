-- Bridge English: profiles, plans, footprints, weekly reviews + RLS
-- Auth model: marketing pages anonymous; plan/tasks/footprints/review require login.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  plan_tier text not null default 'free'
    check (plan_tier in ('free', 'daily', 'deep')),
  plan_focus jsonb,
  locale text not null default 'zh-CN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Per-user profile; plan_tier is free/daily/deep (no payment yet).';
comment on column public.profiles.plan_focus is 'Mirrors localStorage bridge-plan-focus: {one, why, at}.';

-- ---------------------------------------------------------------------------
-- learning_plans
-- ---------------------------------------------------------------------------
create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  questionnaire jsonb not null default '{}'::jsonb,
  goal_sentence text,
  week_focus text,
  retest_at date,
  tasks_progress jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_plans_user_id_idx
  on public.learning_plans (user_id);

create index if not exists learning_plans_user_status_idx
  on public.learning_plans (user_id, status);

comment on column public.learning_plans.questionnaire is 'Plan wizard answers JSON (scene, goal12, block, …).';
comment on column public.learning_plans.tasks_progress is 'v1 task progress embedded in plan JSON; dedicated tasks table later.';

-- ---------------------------------------------------------------------------
-- footprints (aligns with localStorage bridge-footprints)
-- ---------------------------------------------------------------------------
create table if not exists public.footprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references public.learning_plans (id) on delete set null,
  client_id text,
  scene text not null,
  title text not null,
  body text not null,
  criteria_met boolean not null default false,
  self_rating text,
  migrated boolean not null default false,
  mode text not null default 'text'
    check (mode in ('text', 'voice')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists footprints_user_created_idx
  on public.footprints (user_id, created_at desc);

create unique index if not exists footprints_user_client_id_uidx
  on public.footprints (user_id, client_id)
  where client_id is not null;

comment on column public.footprints.body is 'Independent output text (localStorage field: raw).';
comment on column public.footprints.criteria_met is 'localStorage: stdChecked';
comment on column public.footprints.migrated is 'localStorage: migrateChecked';
comment on column public.footprints.client_id is 'Optional legacy id (fp_…) for dual-write migration.';

-- ---------------------------------------------------------------------------
-- weekly_reviews
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_key text not null,
  answers jsonb not null default '{}'::jsonb,
  focus_next text,
  footprint_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_key)
);

create index if not exists weekly_reviews_user_week_idx
  on public.weekly_reviews (user_id, week_key);

comment on column public.weekly_reviews.answers is 'dims + migrateLive from prototype review payload.';
comment on column public.weekly_reviews.focus_next is 'localStorage nextFocus';

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists learning_plans_set_updated_at on public.learning_plans;
create trigger learning_plans_set_updated_at
  before update on public.learning_plans
  for each row execute function public.set_updated_at();

drop trigger if exists footprints_set_updated_at on public.footprints;
create trigger footprints_set_updated_at
  before update on public.footprints
  for each row execute function public.set_updated_at();

drop trigger if exists weekly_reviews_set_updated_at on public.weekly_reviews;
create trigger weekly_reviews_set_updated_at
  before update on public.weekly_reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.learning_plans enable row level security;
alter table public.footprints enable row level security;
alter table public.weekly_reviews enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- learning_plans
drop policy if exists "plans_select_own" on public.learning_plans;
create policy "plans_select_own"
  on public.learning_plans for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "plans_insert_own" on public.learning_plans;
create policy "plans_insert_own"
  on public.learning_plans for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "plans_update_own" on public.learning_plans;
create policy "plans_update_own"
  on public.learning_plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "plans_delete_own" on public.learning_plans;
create policy "plans_delete_own"
  on public.learning_plans for delete
  to authenticated
  using (auth.uid() = user_id);

-- footprints
drop policy if exists "footprints_select_own" on public.footprints;
create policy "footprints_select_own"
  on public.footprints for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "footprints_insert_own" on public.footprints;
create policy "footprints_insert_own"
  on public.footprints for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "footprints_update_own" on public.footprints;
create policy "footprints_update_own"
  on public.footprints for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "footprints_delete_own" on public.footprints;
create policy "footprints_delete_own"
  on public.footprints for delete
  to authenticated
  using (auth.uid() = user_id);

-- weekly_reviews
drop policy if exists "reviews_select_own" on public.weekly_reviews;
create policy "reviews_select_own"
  on public.weekly_reviews for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reviews_insert_own" on public.weekly_reviews;
create policy "reviews_insert_own"
  on public.weekly_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.weekly_reviews;
create policy "reviews_update_own"
  on public.weekly_reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.weekly_reviews;
create policy "reviews_delete_own"
  on public.weekly_reviews for delete
  to authenticated
  using (auth.uid() = user_id);

-- PostgREST needs GRANTs in addition to RLS
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.learning_plans to authenticated;
grant select, insert, update, delete on public.footprints to authenticated;
grant select, insert, update, delete on public.weekly_reviews to authenticated;
grant usage, select on all sequences in schema public to authenticated;
