-- Imperium Task Manager — v3: clients, checklist templates & scheduling.
-- Run this in the Supabase SQL editor AFTER 20260711000000_v2_multitenant.sql.
-- Additive and re-runnable: it only creates new tables/columns/policies and
-- backfills existing rows, so it never touches live job/crew data.
--
-- What it adds:
--   • clients               — a real client book (name, address, frequency, notes)
--   • checklist_templates   — reusable task lists, with template_items
--   • jobs.scheduled_date   — the day a job is scheduled (powers the Schedule tab)
--   • jobs.client_id        — optional link from a job to a client
--   • jobs.template_id      — which template a job was created from (powers "in use")
--   • jobs.approved_at      — when a job was approved (powers Reports), kept by trigger

-- ── new tables ──────────────────────────────────────────────────────
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  address text not null default '',
  frequency text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  photo_policy text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  label text not null,
  position integer not null default 0
);

-- ── job columns ─────────────────────────────────────────────────────
alter table public.jobs add column if not exists scheduled_date date;
alter table public.jobs add column if not exists client_id uuid references public.clients (id) on delete set null;
alter table public.jobs add column if not exists template_id uuid references public.checklist_templates (id) on delete set null;
alter table public.jobs add column if not exists approved_at timestamptz;

create index if not exists clients_company_idx on public.clients (company_id);
create index if not exists checklist_templates_company_idx on public.checklist_templates (company_id);
create index if not exists template_items_template_idx on public.template_items (template_id);
create index if not exists template_items_company_idx on public.template_items (company_id);
create index if not exists jobs_scheduled_date_idx on public.jobs (company_id, scheduled_date);
create index if not exists jobs_template_idx on public.jobs (template_id);

-- ── backfill so existing data shows up immediately ──────────────────
-- Put existing jobs on the schedule (the day they were created) and give
-- already-approved jobs an approval time so Reports has history.
-- Note: created_at::date truncates in the DB session zone (UTC on Supabase),
-- so a legacy job created late-evening local time may land one day off on the
-- grid. This is a one-time backfill of pre-existing rows only — every job
-- created or rescheduled afterwards is written with the app's local date.
update public.jobs set scheduled_date = created_at::date where scheduled_date is null;
update public.jobs set approved_at = created_at where status = 'approved' and approved_at is null;

-- ── keep approved_at in sync with status ────────────────────────────
create or replace function public.set_job_approved_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and new.status is distinct from old.status then
    new.approved_at := now();
  elsif new.status <> 'approved' then
    new.approved_at := null;
  end if;
  return new;
end $$;

drop trigger if exists jobs_set_approved_at on public.jobs;
create trigger jobs_set_approved_at
  before update on public.jobs
  for each row execute function public.set_job_approved_at();

-- ── row level security ──────────────────────────────────────────────
alter table public.clients enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.template_items enable row level security;

drop policy if exists "members read company clients" on public.clients;
create policy "members read company clients" on public.clients
  for select using (company_id = public.current_company_id());
drop policy if exists "managers manage clients" on public.clients;
create policy "managers manage clients" on public.clients
  for all using (company_id = public.current_company_id() and public.is_manager())
  with check (company_id = public.current_company_id() and public.is_manager());

drop policy if exists "members read company templates" on public.checklist_templates;
create policy "members read company templates" on public.checklist_templates
  for select using (company_id = public.current_company_id());
drop policy if exists "managers manage templates" on public.checklist_templates;
create policy "managers manage templates" on public.checklist_templates
  for all using (company_id = public.current_company_id() and public.is_manager())
  with check (company_id = public.current_company_id() and public.is_manager());

drop policy if exists "members read company template items" on public.template_items;
create policy "members read company template items" on public.template_items
  for select using (company_id = public.current_company_id());
drop policy if exists "managers manage template items" on public.template_items;
create policy "managers manage template items" on public.template_items
  for all using (company_id = public.current_company_id() and public.is_manager())
  with check (company_id = public.current_company_id() and public.is_manager()
    -- item must belong to a template in the caller's own company, so a
    -- manager can't attach rows to another company's template_id.
    and exists (select 1 from public.checklist_templates t
      where t.id = template_id and t.company_id = public.current_company_id()));

-- ── realtime ────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clients') then
    alter publication supabase_realtime add table public.clients;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'checklist_templates') then
    alter publication supabase_realtime add table public.checklist_templates;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'template_items') then
    alter publication supabase_realtime add table public.template_items;
  end if;
end $$;
