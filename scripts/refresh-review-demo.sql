-- Refresh the App Review demo company so reviewers always see live work.
-- Run in the Supabase SQL editor RIGHT BEFORE submitting for review (and
-- again if a review happens days later — reviewers must see today's jobs,
-- because the field app's Home screen shows only the current day).
--
-- One-time setup (through the real apps, ~5 minutes):
--   1. Console → Create company: name it   App Review Co
--      (manager account, e.g. review-manager@margian.co)
--   2. Team → generate a crew invite; sign up in the field app as e.g.
--      review-crew@margian.co  — these are the credentials you paste into
--      App Store Connect → App Review Information.
--   3. Add a client, a template, and 2–3 jobs with checklists; complete one
--      with photos so the review queue and lightbox have content.
--
-- Then this script keeps it fresh: it moves every job of that company onto
-- today's schedule.

update public.jobs
set scheduled_date = current_date
where company_id = (select id from public.companies where name = 'App Review Co' limit 1);

-- Optional: reopen an approved job so the reviewer can walk the full
-- checklist → submit flow themselves (uncomment to use).
-- update public.jobs
-- set status = 'todo'
-- where company_id = (select id from public.companies where name = 'App Review Co' limit 1)
--   and status = 'approved';
