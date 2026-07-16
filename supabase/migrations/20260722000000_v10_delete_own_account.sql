-- Imperium Task Manager — v10: in-app account deletion.
-- Run this in the Supabase SQL editor AFTER the v2–v9 migrations.
-- Additive and re-runnable.
--
-- Apple App Store guideline 5.1.1(v): an app that lets people create an
-- account must let them delete it from inside the app. The field app calls
-- this RPC from the Profile screen (and from the deactivated-account screen).
--
-- What deletion does (via existing FK cascades):
--   • the auth.users row is deleted → profiles cascades → the user's issues,
--     messages and time entries are deleted; jobs they were assigned keep
--     their history with assignee set to null.
--   • the user's ISSUE photos are removed: the app deletes the files through
--     the storage API first (best effort), and this RPC deletes any remaining
--     metadata rows so nothing stays reachable.
--   • photos attached to the company's JOBS are kept: they're the company's
--     work records (stated in the privacy policy).
--   • when the caller is the last ACTIVE member (sole owner, or a manager
--     whose only other members are deactivated ex-employees), the whole
--     company is dissolved: every member account, the storage metadata for
--     its photos, and the companies row.
--
-- Guards & concurrency:
--   • an ACTIVE manager whose company still has other ACTIVE members but no
--     other ACTIVE manager must promote someone first. Deactivated callers
--     and crew are never blocked.
--   • the company row is locked FOR UPDATE first, which serializes two
--     concurrent deletions (second one re-counts and hits the guard) and
--     makes a concurrent invite signup fail cleanly instead of leaving an
--     orphaned half-account.

create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cid uuid;
  my_role text;
  my_active boolean;
  total_members int;
  active_others int;
  active_manager_others int;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select company_id, role, active into cid, my_role, my_active
    from profiles where id = uid;

  -- Orphaned auth account with no profile (e.g. a failed signup): just
  -- remove it.
  if cid is null then
    delete from auth.users where id = uid;
    return;
  end if;

  -- Serialize deletions (and racing signups) per company.
  perform 1 from companies where id = cid for update;

  select count(*),
         count(*) filter (where active and id <> uid),
         count(*) filter (where active and role = 'manager' and id <> uid)
    into total_members, active_others, active_manager_others
    from profiles where company_id = cid;

  if my_active and my_role = 'manager'
     and active_others > 0 and active_manager_others = 0 then
    raise exception 'You are the only active manager of your company. Make another active member a manager before deleting your account.';
  end if;

  if total_members = 1 or (my_active and my_role = 'manager' and active_others = 0) then
    -- Last active member: dissolve the company. Deactivated ex-members'
    -- accounts go too — their profiles would cascade away with the company,
    -- which would strand unusable auth rows otherwise.
    delete from auth.users where id in (select id from profiles where company_id = cid);
    -- Metadata backstop: the app already removed files via the storage API
    -- (best effort); this makes anything it missed permanently unreachable.
    delete from storage.objects
      where bucket_id = 'job-photos'
        and (storage.foldername(name))[1] = cid::text;
    delete from companies where id = cid;
    return;
  end if;

  -- Backstop for the caller's issue photos (rows cascade with the account;
  -- the app deletes the files via the storage API before calling this).
  delete from storage.objects
    where bucket_id = 'job-photos'
      and name in (select photo_path from issues
                   where author_id = uid and photo_path is not null);

  delete from auth.users where id = uid;
end $$;

-- Only signed-in users may call it (and only ever on themselves).
revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- Members may delete their company's photos through the storage API. This is
-- what lets the app truly remove file bytes (SQL deletes on storage.objects
-- only drop metadata) — used for issue photos before account deletion and by
-- the failed-upload cleanup path.
drop policy if exists "company deletes own job photos" on storage.objects;
create policy "company deletes own job photos" on storage.objects
  for delete using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );
