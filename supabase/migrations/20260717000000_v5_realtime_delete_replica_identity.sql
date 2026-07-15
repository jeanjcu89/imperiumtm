-- Imperium Task Manager — v5: make realtime DELETE events reach the console.
-- Run this in the Supabase SQL editor AFTER the v2–v4 migrations.
-- Additive and re-runnable: it only changes each table's replica identity.
--
-- Why: the console subscribes to changes with a `company_id=eq.<id>` filter.
-- On INSERT/UPDATE the WAL carries the full new row, so the filter matches and
-- the UI refetches. On DELETE, Postgres writes only the REPLICA IDENTITY
-- columns to the WAL — by default just the primary key — so `company_id` is
-- absent, the filter never matches, and the delete event is dropped. That's
-- why deleting a job/client/template/etc. didn't refresh the page.
--
-- Setting REPLICA IDENTITY FULL makes DELETE (and UPDATE) events include every
-- column of the old row, so the company_id filter matches and realtime deletes
-- propagate. The extra WAL cost is negligible at this app's scale.

alter table public.jobs                replica identity full;
alter table public.checklist_items     replica identity full;
alter table public.issues              replica identity full;
alter table public.messages            replica identity full;
alter table public.time_entries        replica identity full;
alter table public.profiles            replica identity full;
alter table public.invites             replica identity full;
alter table public.clients             replica identity full;
alter table public.checklist_templates replica identity full;
alter table public.template_items      replica identity full;
