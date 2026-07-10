-- Imperium Task Manager — initial schema.
-- Run this in the Supabase SQL editor (or `supabase db push` with the CLI),
-- then run 20260710000001_seed.sql for the demo data.

create table public.jobs (
  id text primary key default gen_random_uuid()::text,
  client text not null,
  address text not null,
  time_label text not null,
  employee text not null,
  status text not null default 'todo'
    check (status in ('todo', 'inprogress', 'submitted', 'approved')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.jobs (id) on delete cascade,
  label text not null,
  done boolean not null default false,
  photo boolean not null default false,
  position integer not null default 0
);

create table public.issues (
  id bigint generated always as identity primary key,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id bigint generated always as identity primary key,
  body text not null,
  sender text not null,
  mine boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.time_entries (
  id bigint generated always as identity primary key,
  employee text not null,
  clock_in timestamptz not null default now(),
  clock_out timestamptz
);

create index checklist_items_job_id_idx on public.checklist_items (job_id);
create index time_entries_open_idx on public.time_entries (employee) where clock_out is null;

-- Row level security: wide-open demo policies (the app has no auth yet).
-- Replace with auth-based policies before real production use.
alter table public.jobs enable row level security;
alter table public.checklist_items enable row level security;
alter table public.issues enable row level security;
alter table public.messages enable row level security;
alter table public.time_entries enable row level security;

create policy "demo full access" on public.jobs for all using (true) with check (true);
create policy "demo full access" on public.checklist_items for all using (true) with check (true);
create policy "demo full access" on public.issues for all using (true) with check (true);
create policy "demo full access" on public.messages for all using (true) with check (true);
create policy "demo full access" on public.time_entries for all using (true) with check (true);

-- Broadcast changes so every open client stays in sync.
alter publication supabase_realtime add table
  public.jobs, public.checklist_items, public.issues, public.messages, public.time_entries;
