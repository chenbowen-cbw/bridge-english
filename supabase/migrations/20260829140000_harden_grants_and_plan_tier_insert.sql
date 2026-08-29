-- Harden plan_tier INSERT; revoke client table privileges; revoke guard EXECUTE.

-- 1) Authenticated cannot INSERT plan_tier (default / trigger still yield 'free')
revoke insert on table public.profiles from authenticated;
grant insert (user_id, display_name, plan_focus, locale) on table public.profiles to authenticated;

-- 2) guard_plan_tier: INSERT from authenticated is forced to free; UPDATE still blocked
create or replace function public.guard_plan_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(auth.role(), '') = 'authenticated' then
      new.plan_tier := 'free';
    end if;
    return new;
  end if;

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
  before insert or update on public.profiles
  for each row execute function public.guard_plan_tier();

revoke all on function public.guard_plan_tier() from public;
revoke all on function public.guard_plan_tier() from anon;
revoke all on function public.guard_plan_tier() from authenticated;

-- 3) Clients should not TRUNCATE / attach TRIGGER / create REFERENCES
revoke truncate, trigger, references on table public.profiles from anon, authenticated;
revoke truncate, trigger, references on table public.learning_plans from anon, authenticated;
revoke truncate, trigger, references on table public.footprints from anon, authenticated;
revoke truncate, trigger, references on table public.weekly_reviews from anon, authenticated;
revoke truncate, trigger, references on table public.ai_coach_daily from anon, authenticated;
