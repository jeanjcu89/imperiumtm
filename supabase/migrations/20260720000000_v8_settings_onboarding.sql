-- Imperium Task Manager — v8: company profile fields & manager onboarding.
-- Run this in the Supabase SQL editor AFTER the v2–v7 migrations.
-- Additive and re-runnable.
--
-- What it adds:
--   • companies.address / phone — the company profile managers edit in the
--     console's new Settings page.
--   • profiles.onboarded_at — set when a manager finishes (or dismisses) the
--     getting-started tour, so it only shows for new managers.
--
-- No new policies needed: v2 already lets managers update their company
-- ("managers update own company"), users update their own profile ("users
-- update own profile"), and managers update company profiles ("managers
-- update company profiles"). profiles is already in the realtime publication;
-- companies is not, but the Settings page refetches after saving, so company
-- edits don't need realtime.

alter table public.companies add column if not exists address text not null default '';
alter table public.companies add column if not exists phone text not null default '';

alter table public.profiles add column if not exists onboarded_at timestamptz;
