-- Lock plan_tier from client updates; harden triggers; ai_coach daily quota.

-- 1) Column-level: authenticated may not UPDATE plan_tier
revoke update on table public.profiles from authenticated;
grant update (display_name, plan_focus, locale) on table public.profiles to authenticated;

-- Defense in depth: reject plan_tier changes from authenticated role
create or replace function public.guard_plan_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.plan_tier is distinct from old.plan_tier
     and coalesce(auth.role(), '') = 'authenticated' then
    raise exception 'plan_tier is server-managed and cannot be changed by clients'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_plan_tier on public.profiles;
create trigger profiles_guard_plan_tier
  before update on public.profiles
  for each row execute function public.guard_plan_tier();

-- 2) set_updated_at: pin search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) handle_new_user: revoke public execute (security definer)
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
-- trigger still runs as owner

-- 4) AI coach daily usage (user + day)
create table if not exists public.ai_coach_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default ((timezone('utc', now()))::date),
  count int not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_coach_daily enable row level security;

drop policy if exists "ai_coach_daily_select_own" on public.ai_coach_daily;
create policy "ai_coach_daily_select_own"
  on public.ai_coach_daily for select
  to authenticated
  using (auth.uid() = user_id);

-- Clients cannot insert/update usage; edge function uses service role or RPC

create or replace function public.bump_ai_coach_daily(p_limit int default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d date := (timezone('utc', now()))::date;
  c int;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into public.ai_coach_daily (user_id, day, count)
  values (uid, d, 1)
  on conflict (user_id, day) do update
    set count = public.ai_coach_daily.count + 1
  returning count into c;

  if c > p_limit then
    -- roll back the bump
    update public.ai_coach_daily
      set count = greatest(count - 1, 0)
      where user_id = uid and day = d;
    return jsonb_build_object(
      'allowed', false,
      'count', c - 1,
      'limit', p_limit,
      'day', d
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'count', c,
    'limit', p_limit,
    'day', d
  );
end;
$$;

revoke all on function public.bump_ai_coach_daily(int) from public;
grant execute on function public.bump_ai_coach_daily(int) to authenticated;

grant select on public.ai_coach_daily to authenticated;
