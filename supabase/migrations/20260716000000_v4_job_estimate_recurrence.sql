-- Imperium Task Manager — v4: estimated job duration & recurring jobs.
-- Run this in the Supabase SQL editor AFTER the v2 and v3 migrations.
-- Additive and re-runnable: it only adds two nullable columns + an index and
-- never touches existing rows.
--
-- What it adds:
--   • jobs.estimated_hours      — how long a job is expected to take (hours)
--   • jobs.recurrence_group_id  — links the occurrences of one recurring job
--                                 so a whole series can be managed together.
--                                 A one-off job leaves this null.

alter table public.jobs add column if not exists estimated_hours numeric;
alter table public.jobs add column if not exists recurrence_group_id uuid;

create index if not exists jobs_recurrence_group_idx
  on public.jobs (recurrence_group_id);

-- Existing RLS on public.jobs already covers these columns (policies are
-- row-scoped by company_id, not column-scoped), and jobs is already in the
-- realtime publication — so no policy or publication changes are needed.
