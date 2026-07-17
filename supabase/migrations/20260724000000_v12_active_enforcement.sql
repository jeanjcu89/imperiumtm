-- v12: deactivated accounts lose WRITE access at the API layer.
--
-- Deactivation was UI-only: is_manager() checked role but not active, so a
-- deactivated ex-manager kept every manager power over PostgREST (edit team,
-- approve jobs, mint invites), and deactivated crew could still clock in,
-- tick checklists, and post issues/messages. Reads are deliberately left
-- alone — deactivated members keep seeing their history, and the apps need
-- the profile row to show the "account deactivated" screen.

-- Every manager-gated policy plus the v9 column-protection trigger inherit
-- this fix automatically.
create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as
$$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'manager' and active
  )
$$;

-- Crew-side write paths get an explicit active check.
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and active) $$;

-- ── recreate the crew-capable write policies with the active guard ────────
-- (Each is the v2 expression with is_active_member() added to the
-- non-manager branch; the manager branch is covered by is_manager() above.)

drop policy if exists "managers or assignee update jobs" on public.jobs;
create policy "managers or assignee update jobs" on public.jobs
  for update using (company_id = public.current_company_id()
    and (public.is_manager()
      or (assignee_id = auth.uid() and public.is_active_member())))
  with check (company_id = public.current_company_id()
    and (public.is_manager()
      or (assignee_id = auth.uid() and status <> 'approved' and public.is_active_member())));

drop policy if exists "managers or assignee update items" on public.checklist_items;
create policy "managers or assignee update items" on public.checklist_items
  for update using (company_id = public.current_company_id()
    and (public.is_manager()
      or (public.is_active_member()
        and exists (select 1 from public.jobs j where j.id = job_id and j.assignee_id = auth.uid()))))
  with check (company_id = public.current_company_id());

drop policy if exists "members report issues" on public.issues;
create policy "members report issues" on public.issues
  for insert with check (company_id = public.current_company_id()
    and author_id = auth.uid() and public.is_active_member());

drop policy if exists "own thread or manager sends messages" on public.messages;
create policy "own thread or manager sends messages" on public.messages
  for insert with check (company_id = public.current_company_id()
    and sender_id = auth.uid()
    and (public.is_manager()
      or (thread_id = auth.uid() and public.is_active_member())));

drop policy if exists "employees insert own time entries" on public.time_entries;
create policy "employees insert own time entries" on public.time_entries
  for insert with check (company_id = public.current_company_id()
    and employee_id = auth.uid() and public.is_active_member());

drop policy if exists "employee or manager updates time entries" on public.time_entries;
create policy "employee or manager updates time entries" on public.time_entries
  for update using (company_id = public.current_company_id()
    and ((employee_id = auth.uid() and public.is_active_member()) or public.is_manager()))
  with check (company_id = public.current_company_id());
