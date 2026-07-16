-- Imperium Task Manager — v7: manager replies & resolution on issue reports.
-- Run this in the Supabase SQL editor AFTER the v2–v6 migrations.
-- Additive and re-runnable.
--
-- What it adds:
--   • issues.reply / replied_by / replied_at — one manager reply per issue,
--     shown to the crew member in the field app (deeper back-and-forth
--     belongs in Chat).
--   • issues.resolved_at — set when a manager marks the issue handled.
--   • an UPDATE policy so managers can write those columns.
--
-- replied_by is a plain uuid on purpose (no FK to profiles): a second FK to
-- profiles would make PostgREST's existing `author:profiles(...)` embed on
-- issues ambiguous and break the currently-deployed apps the moment this
-- migration runs. The id is informational; the UIs label replies "Manager".

alter table public.issues add column if not exists reply text;
alter table public.issues add column if not exists replied_by uuid;
alter table public.issues add column if not exists replied_at timestamptz;
alter table public.issues add column if not exists resolved_at timestamptz;

drop policy if exists "managers update issues" on public.issues;
create policy "managers update issues" on public.issues
  for update using (company_id = public.current_company_id() and public.is_manager())
  with check (company_id = public.current_company_id() and public.is_manager());

-- issues is already in the realtime publication (v2) with replica identity
-- full (v5), so replies and resolutions propagate live to both apps.
