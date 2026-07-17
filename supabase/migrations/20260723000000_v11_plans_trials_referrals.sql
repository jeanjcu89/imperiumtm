-- v11: monetization foundation — plans, 30-day Pro trials, referrals,
-- seat limits, and Stripe mirror columns.
--
-- Model:
--   * companies.plan is 'free' or 'pro'. 'pro' is set ONLY by the Stripe
--     webhook (service role). The EFFECTIVE plan is:
--       pro    when plan = 'pro'
--       trial  when plan <> 'pro' and trial_ends_at > now()   (full Pro access)
--       free   otherwise
--   * Every company gets a 30-day trial from creation (existing companies are
--     grandfathered into a fresh 30 days at migration time).
--   * Free plan limits: 1 active manager + 2 active crew. Photo retention is
--     a soft gate enforced in the apps (photos are never deleted).
--   * Referrals: a company signs up with another company's referral code —
--     both sides get +30 days of trial. Referrer capped at 6 redemptions.
--   * One self-serve trial extension (+14 days) via extend_trial().

-- ── companies: plan, trial, referral & Stripe columns ─────────────────────

alter table public.companies
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro')),
  add column if not exists trial_ends_at timestamptz not null
    default (now() + interval '30 days'),
  add column if not exists trial_extended_at timestamptz,
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.companies(id) on delete set null,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_status text;

-- Referral codes share the invite-code alphabet (no 0/O/1/I/L) and are
-- stored uppercase; uniqueness is retried in a loop.
create or replace function public.gen_referral_code()
returns text language plpgsql volatile as
$$
declare
  abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(abc, 1 + floor(random() * length(abc))::int, 1);
    end loop;
    exit when not exists (select 1 from public.companies where referral_code = code);
  end loop;
  return code;
end
$$;

update public.companies
set referral_code = public.gen_referral_code()
where referral_code is null;

create unique index if not exists companies_referral_code_key
  on public.companies (referral_code);

-- ── referrals ledger ──────────────────────────────────────────────────────

create table if not exists public.referrals (
  id bigint generated always as identity primary key,
  referrer_company_id uuid not null references public.companies(id) on delete cascade,
  referred_company_id uuid not null references public.companies(id) on delete cascade unique,
  days_granted int not null default 30,
  created_at timestamptz not null default now()
);

create index if not exists referrals_referrer_idx
  on public.referrals (referrer_company_id);

alter table public.referrals enable row level security;

drop policy if exists "members read own referrals" on public.referrals;
create policy "members read own referrals" on public.referrals
  for select using (referrer_company_id = public.current_company_id());
-- No INSERT/UPDATE/DELETE policies: rows are written only by the signup
-- trigger (security definer).

-- ── plan helpers ──────────────────────────────────────────────────────────

create or replace function public.effective_plan(p_company uuid)
returns text language sql stable security definer set search_path = public as
$$
  select case
    when c.plan = 'pro' then 'pro'
    when c.trial_ends_at > now() then 'trial'
    else 'free'
  end
  from companies c where c.id = p_company
$$;

-- Is there room for one more ACTIVE member of this role? Trial and Pro are
-- unlimited; free is 1 manager + 2 crew.
create or replace function public.seat_available(p_company uuid, p_role text)
returns boolean language sql stable security definer set search_path = public as
$$
  select case
    when public.effective_plan(p_company) in ('pro', 'trial') then true
    when p_role = 'crew' then
      (select count(*) from profiles
        where company_id = p_company and role = 'crew' and active) < 2
    else
      (select count(*) from profiles
        where company_id = p_company and role = 'manager' and active) < 1
  end
$$;

create or replace function public.assert_seat_available(p_company uuid, p_role text)
returns void language plpgsql security definer set search_path = public as
$$
begin
  -- Serialize seat checks per company (same convention as v10's
  -- delete_own_account): without this lock, N concurrent activations or
  -- invite signups each count the committed pre-state and all pass,
  -- overshooting the free limits.
  perform 1 from companies where id = p_company for update;
  if public.seat_available(p_company, p_role) then
    return;
  end if;
  if p_role = 'crew' then
    raise exception 'The free plan includes 2 active crew seats — upgrade to Pro in the console to add more.';
  else
    raise exception 'The free plan includes 1 active manager seat — upgrade to Pro in the console to add more.';
  end if;
end
$$;

-- Pre-signup seat check for the field app (mirrors validate_invite: the auth
-- trigger's raise would surface as an opaque "Database error saving new user",
-- so clients check first and show a friendly message).
create or replace function public.invite_seat_available(p_code text)
returns boolean language sql stable security definer set search_path = public as
$$
  select coalesce((
    select public.seat_available(i.company_id, i.role)
    from invites i
    where i.code = upper(trim(p_code)) and i.used_by is null
  ), false)
$$;

grant execute on function public.invite_seat_available(text) to anon, authenticated;

-- Pre-signup referral check for the console signup form. True while the code
-- exists and the referrer still has redemptions left (cap 6).
create or replace function public.validate_referral(p_code text)
returns boolean language sql stable security definer set search_path = public as
$$
  select exists (
    select 1 from companies c
    where c.referral_code = upper(trim(p_code))
      and (select count(*) from referrals r where r.referrer_company_id = c.id) < 6
  )
$$;

grant execute on function public.validate_referral(text) to anon, authenticated;

-- ── protect plan & billing columns from the client API ────────────────────
-- "managers update own company" allows row updates (Settings saves name /
-- address / phone), which would otherwise let any manager set plan = 'pro'.
-- Definer functions that legitimately write plan fields set a transaction-
-- local flag; the service role (webhook, SQL editor) has auth.uid() null.

create or replace function public.protect_company_plan_columns()
returns trigger language plpgsql as
$$
begin
  if auth.uid() is null then return new; end if;
  if current_setting('imperium.allow_plan_write', true) = 'on' then return new; end if;
  if new.plan is distinct from old.plan
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.trial_extended_at is distinct from old.trial_extended_at
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.stripe_status is distinct from old.stripe_status then
    raise exception 'Plan and billing fields are managed by the billing system';
  end if;
  return new;
end
$$;

drop trigger if exists companies_protect_plan on public.companies;
create trigger companies_protect_plan
  before update on public.companies
  for each row execute function public.protect_company_plan_columns();

-- ── seat enforcement on the client-facing write paths ─────────────────────

-- Reactivating a member or changing an active member's role must fit the
-- plan. Deactivation is always allowed.
create or replace function public.enforce_profile_seats()
returns trigger language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then return new; end if;
  if (new.active and not old.active)
     or (new.active and new.role is distinct from old.role) then
    perform public.assert_seat_available(new.company_id, new.role);
  end if;
  return new;
end
$$;

drop trigger if exists profiles_enforce_seats on public.profiles;
create trigger profiles_enforce_seats
  before update on public.profiles
  for each row execute function public.enforce_profile_seats();

-- Creating an invite for a role with no seat left fails immediately, so the
-- manager finds out in the Team tab rather than the invitee at signup.
-- (Outstanding unused invites are deliberately NOT counted: the final gate
-- is at signup, and invites may go unused.)
create or replace function public.enforce_invite_seats()
returns trigger language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then return new; end if;
  perform public.assert_seat_available(new.company_id, new.role);
  return new;
end
$$;

drop trigger if exists invites_enforce_seats on public.invites;
create trigger invites_enforce_seats
  before insert on public.invites
  for each row execute function public.enforce_invite_seats();

-- ── signup trigger: trial, referral bonus, seat gate on invites ───────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  meta jsonb := new.raw_user_meta_data;
  v_company uuid;
  v_role text;
  v_invite invites%rowtype;
  v_name text := coalesce(nullif(trim(meta ->> 'full_name'), ''), split_part(new.email, '@', 1));
  v_ref_code text := nullif(trim(meta ->> 'referral_code'), '');
  v_referrer companies%rowtype;
begin
  perform set_config('imperium.allow_plan_write', 'on', true);

  if nullif(trim(meta ->> 'company_name'), '') is not null then
    insert into companies (name, referral_code)
    values (trim(meta ->> 'company_name'), public.gen_referral_code())
    returning id into v_company;
    v_role := 'manager';

    -- Referral bonus: +30 days for both sides, referrer capped at 6
    -- redemptions. Invalid or exhausted codes are skipped, not fatal —
    -- the console pre-validates via validate_referral(), and failing the
    -- whole signup over a referral typo would be worse than no bonus.
    if v_ref_code is not null then
      select * into v_referrer from companies
        where referral_code = upper(v_ref_code)
        for update;
      if found and (select count(*) from referrals
                    where referrer_company_id = v_referrer.id) < 6 then
        update companies
          set trial_ends_at = trial_ends_at + interval '30 days',
              referred_by = v_referrer.id
          where id = v_company;
        update companies
          set trial_ends_at = greatest(trial_ends_at, now()) + interval '30 days'
          where id = v_referrer.id;
        insert into referrals (referrer_company_id, referred_company_id, days_granted)
        values (v_referrer.id, v_company, 30);
      end if;
    end if;
  elsif nullif(trim(meta ->> 'invite_code'), '') is not null then
    select * into v_invite from invites
      where code = upper(trim(meta ->> 'invite_code')) and used_by is null
      for update;
    if not found then
      raise exception 'Invalid or already-used invite code';
    end if;
    v_company := v_invite.company_id;
    v_role := v_invite.role;
    -- Final seat gate (the field app pre-checks invite_seat_available for a
    -- friendly error; this closes the race of two signups on the last seat).
    perform public.assert_seat_available(v_company, v_role);
  else
    raise exception 'Signup requires a company_name or an invite_code';
  end if;

  insert into profiles (id, company_id, full_name, role)
  values (new.id, v_company, v_name, v_role);

  if v_invite.code is not null then
    update invites set used_by = new.id, used_at = now() where code = v_invite.code;
  end if;

  return new;
end
$$;

-- ── one-time self-serve trial extension (+14 days) ────────────────────────

create or replace function public.extend_trial()
returns timestamptz language plpgsql security definer set search_path = public as
$$
declare
  v_company uuid := public.current_company_id();
  v_ends timestamptz;
begin
  -- Not is_manager(): that helper ignores the active flag, and a
  -- deactivated ex-manager must not be able to burn the one extension.
  if v_company is null or not exists (
    select 1 from profiles
    where id = auth.uid() and role = 'manager' and active
  ) then
    raise exception 'Only an active manager can extend the trial';
  end if;
  perform set_config('imperium.allow_plan_write', 'on', true);
  update companies
    set trial_ends_at = greatest(trial_ends_at, now()) + interval '14 days',
        trial_extended_at = now()
    where id = v_company and trial_extended_at is null and plan <> 'pro'
    returning trial_ends_at into v_ends;
  if v_ends is null then
    raise exception 'The one-time trial extension has already been used';
  end if;
  return v_ends;
end
$$;

revoke all on function public.extend_trial() from public, anon;
grant execute on function public.extend_trial() to authenticated;
