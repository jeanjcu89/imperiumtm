-- Imperium Task Manager — v9: protect role/active/company on profiles.
-- Run this in the Supabase SQL editor AFTER the v2–v8 migrations.
-- Additive and re-runnable.
--
-- Why: the v2 policy "users update own profile" has no column restrictions,
-- so any member could PATCH their own row via the API and set role='manager'
-- (privilege escalation) or active=true (undoing a manager's deactivation).
-- This existed since v2, but role/active management became a real console
-- feature in v8, so it's worth closing now.
--
-- A BEFORE UPDATE trigger raises when a NON-manager changes role, active or
-- company_id. Managers still manage members freely, and requests without a
-- JWT (SQL editor, service role) bypass the check so admin operations and
-- future server-side jobs keep working.

create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null            -- end-user request (not SQL editor / service role)
     and not public.is_manager()
     and (new.role is distinct from old.role
       or new.active is distinct from old.active
       or new.company_id is distinct from old.company_id) then
    raise exception 'Only a manager can change role, active status, or company';
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();
