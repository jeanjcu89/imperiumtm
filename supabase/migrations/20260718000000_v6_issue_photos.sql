-- Imperium Task Manager — v6: let crew attach a photo to an issue report.
-- Run this in the Supabase SQL editor AFTER the v2–v5 migrations.
-- Additive and re-runnable: it only adds one nullable column.
--
-- The photo itself lives in the existing private `job-photos` bucket under
-- `<company_id>/issues/…`, which the bucket's company-scoped storage policies
-- already cover (they key on the first path segment = company_id). So no new
-- bucket or storage policy is needed — only somewhere to record the path.

alter table public.issues add column if not exists photo_path text;

-- issues is already in the realtime publication and its RLS policies are
-- row-scoped by company_id, so the new column needs no further changes.
