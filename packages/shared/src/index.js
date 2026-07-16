// @imperium/shared — the one data layer used by the console (web) and
// field (React Native) apps. Everything is company-scoped; RLS enforces
// tenancy server-side, these helpers just keep the two apps consistent.
import { createClient } from '@supabase/supabase-js';

/* ── client ──────────────────────────────────────────────────────── */

// `storage` lets React Native pass AsyncStorage; web uses the default.
export function createImperiumClient({ url, anonKey, storage }) {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      ...(storage ? { storage } : {}),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

/* ── domain helpers ──────────────────────────────────────────────── */

export function statusMeta(s) {
  if (s === 'approved') return { label: 'Approved', bg: '#e2efe5', fg: '#4f8a5b' };
  if (s === 'submitted') return { label: 'In review', bg: '#f7ecd3', fg: '#c9922b' };
  if (s === 'inprogress') return { label: 'In progress', bg: '#f6e0d0', fg: '#d96b2b' };
  return { label: 'To do', bg: '#efe9e0', fg: '#8a7d70' };
}

export function prog(job) {
  const t = job.items.length || 1;
  const d = job.items.filter(i => i.done).length;
  return { d, t, pct: Math.round(d / t * 100) + '%', text: d + '/' + (job.items.length || 0) };
}

const fmtClock = ts => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function timeMeta(ts) {
  const d = new Date(ts);
  const now = new Date();
  const age = now - d;
  if (age >= 0 && age < 60_000) return 'Just now';
  if (d.toDateString() === now.toDateString()) return 'Today · ' + fmtClock(d);
  if (d.toDateString() === new Date(now.getTime() - 86_400_000).toDateString()) return 'Yesterday · ' + fmtClock(d);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + fmtClock(d);
}

export function clockLabel(ts) {
  const age = Date.now() - new Date(ts).getTime();
  return age >= 0 && age < 60_000 ? 'now' : fmtClock(ts);
}

export const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

/* ── week / date helpers (local time; match SQL `date` columns) ──── */

// Local YYYY-MM-DD — the same shape Postgres returns for a `date` column,
// so schedule cells can compare against jobs.scheduledDate without any
// timezone drift.
export function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Monday-start week containing `d`, at local midnight.
export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 6) % 7; // 0=Sun → 6, 1=Mon → 0, …
  x.setDate(x.getDate() - diff);
  return x;
}

// Cap for a still-open (forgotten) clock-out: without one, an entry left open
// on a past day would accrue to Date.now() and show ~150h. A real shift never
// exceeds this, so capping bounds the anomaly without hiding live current shifts.
const MAX_OPEN_ENTRY_MS = 16 * 3_600_000;

// Duration of a time entry in hours; open entries count up to `now`, capped so
// a forgotten clock-out can't blow up a day's total.
export function entryHours(entry, now = Date.now()) {
  const start = new Date(entry.clockIn).getTime();
  const end = entry.clockOut
    ? new Date(entry.clockOut).getTime()
    : Math.min(now, start + MAX_OPEN_ENTRY_MS);
  return Math.max(0, (end - start) / 3_600_000);
}

// Parse a local 'YYYY-MM-DD' into a Date at local midnight — the inverse of
// ymd(), and safe from the UTC shift `new Date('2026-07-15')` would apply.
export function parseYmd(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Occurrence days ('YYYY-MM-DD') for a recurring job, from `start` through
// `until` (inclusive). `weekdays` are JS getDay() numbers (0=Sun … 6=Sat) and
// apply to 'weekly'/'biweekly'; 'monthly' ignores them and repeats on start's
// day-of-month (clamped so the 31st lands on the last day of shorter months).
// `maxCount` bounds the series so a far-off end date can't generate unbounded
// rows; the caller should surface when the cap is hit.
export function recurrenceDates({ start, until, frequency, weekdays = [], maxCount = 200 }) {
  const out = [];
  if (!(start instanceof Date) || isNaN(start.getTime())) return out;
  const end = (until instanceof Date && !isNaN(until.getTime()) && until >= start) ? until : start;

  if (frequency === 'monthly') {
    const dom = start.getDate();
    let y = start.getFullYear(), m = start.getMonth();
    while (out.length < maxCount) {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const d = new Date(y, m, Math.min(dom, daysInMonth));
      if (d > end) break;
      if (d >= start) out.push(ymd(d));
      m += 1; if (m > 11) { m = 0; y += 1; }
    }
    return out;
  }

  if (frequency !== 'weekly' && frequency !== 'biweekly') return out;
  const wanted = new Set(weekdays);
  if (wanted.size === 0) return out;
  const step = frequency === 'biweekly' ? 14 : 7;
  let weekMonday = startOfWeek(start);          // Monday of start's week
  while (out.length < maxCount) {
    for (let i = 0; i < 7 && out.length < maxCount; i++) {
      const d = addDays(weekMonday, i);
      if (d >= start && d <= end && wanted.has(d.getDay())) out.push(ymd(d));
    }
    weekMonday = addDays(weekMonday, step);
    if (weekMonday > end) break;
  }
  return out;
}

/* ── auth ────────────────────────────────────────────────────────── */

// New company → the signup trigger creates the company + manager profile.
export const signUpCompany = (client, { email, password, fullName, companyName }) =>
  client.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, company_name: companyName } },
  });

// Invite code → the signup trigger attaches the user to the invite's company.
export async function signUpWithInvite(client, { email, password, fullName, inviteCode }) {
  const { data: valid, error: vErr } = await client.rpc('validate_invite', { p_code: inviteCode });
  if (vErr) return { data: null, error: vErr };
  if (!valid) return { data: null, error: new Error('Invalid or already-used invite code') };
  return client.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, invite_code: inviteCode } },
  });
}

export const signIn = (client, { email, password }) =>
  client.auth.signInWithPassword({ email, password });

export const signOut = (client) => client.auth.signOut();

export const fetchProfile = (client) =>
  client.auth.getUser().then(({ data, error }) => {
    if (error || !data.user) return { data: null, error };
    return client.from('profiles')
      .select('id, company_id, full_name, role, active, onboarded_at, companies ( name )')
      .eq('id', data.user.id)
      .single()
      .then(({ data: p, error: e }) => ({
        data: p && {
          id: p.id, companyId: p.company_id, fullName: p.full_name,
          role: p.role, active: p.active, companyName: p.companies?.name ?? '',
          email: data.user.email ?? '',
          onboardedAt: p.onboarded_at ?? null,
        },
        error: e,
      }));
  });

/* ── settings (profile & company) ────────────────────────────────── */

export const updateOwnName = (client, userId, fullName) =>
  client.from('profiles').update({ full_name: fullName }).eq('id', userId);

// Manager edits a team member's profile: rename, change role, (de)activate.
export const updateMember = (client, id, { fullName, role, active }) =>
  client.from('profiles').update({
    ...(fullName !== undefined ? { full_name: fullName } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(active !== undefined ? { active } : {}),
  }).eq('id', id);

// Set when a manager finishes or dismisses the getting-started tour.
export const setOnboarded = (client, userId) =>
  client.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', userId);

export const changePassword = (client, newPassword) =>
  client.auth.updateUser({ password: newPassword });

export const fetchCompany = (client, companyId) =>
  client.from('companies')
    .select('id, name, address, phone')
    .eq('id', companyId)
    .single()
    .then(({ data, error }) => ({
      data: data && { id: data.id, name: data.name, address: data.address ?? '', phone: data.phone ?? '' },
      error,
    }));

export const updateCompany = (client, companyId, { name, address, phone }) =>
  client.from('companies').update({ name, address, phone }).eq('id', companyId);

/* ── jobs & checklist ────────────────────────────────────────────── */

const mapJob = row => ({
  id: row.id,
  client: row.client,
  clientId: row.client_id ?? null,
  address: row.address,
  time: row.time_label,
  assigneeId: row.assignee_id,
  employee: row.assignee?.full_name ?? 'Unassigned',
  status: row.status,
  scheduledDate: row.scheduled_date ?? null,   // 'YYYY-MM-DD' (local day) or null
  templateId: row.template_id ?? null,
  approvedAt: row.approved_at ?? null,
  estimatedHours: row.estimated_hours ?? null,
  recurrenceGroupId: row.recurrence_group_id ?? null,
  items: [...(row.checklist_items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(i => ({ id: i.id, label: i.label, done: i.done, photoPath: i.photo_path })),
});

const JOB_SELECT = `id, client, client_id, address, time_label, assignee_id, status, position,
  scheduled_date, template_id, approved_at, estimated_hours, recurrence_group_id,
  assignee:profiles ( full_name ),
  checklist_items ( id, label, done, photo_path, position )`;

export const fetchJobs = (client) =>
  client.from('jobs').select(JOB_SELECT).order('position').order('created_at')
    .then(({ data, error }) => ({ data: data?.map(mapJob) ?? null, error }));

// Create one or more jobs sharing the same client/checklist. `dates` is a list
// of 'YYYY-MM-DD' scheduled days (from recurrenceDates() for a recurring job,
// or a single day for a one-off); an empty/absent list creates one unscheduled
// job. Occurrences of a recurring job share a recurrence_group_id so the series
// can be managed together later.
export async function createJobs(client, {
  companyId, clientName, clientId, address, timeLabel, assigneeId,
  estimatedHours, templateId, itemLabels, dates,
}) {
  const days = (dates && dates.length) ? dates : [null];
  // Only a real series gets a group id; a single job stays ungrouped.
  const groupId = days.length > 1 ? crypto.randomUUID() : null;
  const rows = days.map(scheduled_date => ({
    company_id: companyId, client: clientName, client_id: clientId || null,
    address, time_label: timeLabel, assignee_id: assigneeId || null,
    scheduled_date: scheduled_date || null, template_id: templateId || null,
    estimated_hours: estimatedHours ?? null, recurrence_group_id: groupId,
  }));
  const { data: jobs, error } = await client.from('jobs').insert(rows).select('id');
  if (error) return { error };

  // One checklist per job — flatten every job's items into a single insert.
  const items = jobs.flatMap(job =>
    itemLabels.map((label, i) => ({ job_id: job.id, company_id: companyId, label, position: i + 1 })));
  if (items.length) {
    const { error: iErr } = await client.from('checklist_items').insert(items);
    if (iErr) {
      // Compensating cleanup: jobs and their items are separate writes (no
      // transaction). On an items failure delete every job we just created so
      // none are left checklist-less and a retry can't duplicate the series.
      await client.from('jobs').delete().in('id', jobs.map(j => j.id));
      return { error: iErr };
    }
  }
  return { data: jobs, error: null, count: jobs.length };
}

export const setJobStatus = (client, jobId, status) =>
  client.from('jobs').update({ status }).eq('id', jobId);

export const deleteJob = (client, jobId) =>
  client.from('jobs').delete().eq('id', jobId);

export const setItemDone = (client, itemId, done) =>
  client.from('checklist_items').update({ done }).eq('id', itemId);

export const resetJobItems = (client, jobId) =>
  client.from('checklist_items').update({ done: false }).eq('job_id', jobId);

/* ── photos (Supabase Storage, private bucket) ───────────────────── */

export const PHOTO_BUCKET = 'job-photos';

// `body` is a Blob (web) or ArrayBuffer (React Native, from base64).
export async function uploadItemPhoto(client, { companyId, jobId, itemId, body, contentType = 'image/jpeg' }) {
  const path = `${companyId}/${jobId}/${itemId}-${Date.now()}.jpg`;
  const { error: upErr } = await client.storage.from(PHOTO_BUCKET)
    .upload(path, body, { contentType, upsert: true });
  if (upErr) return { error: upErr };
  const { error } = await client.from('checklist_items')
    .update({ photo_path: path }).eq('id', itemId);
  return { data: path, error };
}

export const getPhotoUrl = (client, path, expiresIn = 3600) =>
  client.storage.from(PHOTO_BUCKET).createSignedUrl(path, expiresIn)
    .then(({ data, error }) => ({ data: data?.signedUrl ?? null, error }));

// Issue photos share the job-photos bucket under `<company_id>/issues/…`, so
// the company-scoped storage policies already apply. Uploaded before the issue
// row is inserted (issues get a serial id we don't have yet), so the caller
// passes the returned path to addIssue().
export async function uploadIssuePhoto(client, { companyId, body, contentType = 'image/jpeg' }) {
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${companyId}/issues/${Date.now()}-${rand}.jpg`;
  const { error } = await client.storage.from(PHOTO_BUCKET)
    .upload(path, body, { contentType, upsert: true });
  return { data: error ? null : path, error };
}

// Compensating cleanup for uploadIssuePhoto when the issue insert then fails —
// otherwise the object is orphaned (its path was never recorded in any row).
// Best-effort: a failed delete just leaves the same orphan we'd have anyway.
export const removePhoto = (client, path) =>
  client.storage.from(PHOTO_BUCKET).remove([path]);

// When a photo was uploaded, recovered from the epoch-ms every photo path
// embeds in its filename (item: <itemId>-<ms>.jpg, issue: <ms>-<rand>.jpg).
// Returns an ISO string or null. This is the proof-of-completion timestamp
// managers verify against, and it works for all photos ever uploaded.
export function photoTimestamp(path) {
  const file = (path ?? '').split('/').pop() ?? '';
  const m = file.match(/(?:^|-)(\d{13})(?:-|\.)/);
  if (!m) return null;
  const d = new Date(Number(m[1]));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/* ── clock ───────────────────────────────────────────────────────── */

export const fetchOpenEntry = (client, employeeId) =>
  client.from('time_entries')
    .select('id, clock_in')
    .eq('employee_id', employeeId)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

export const clockIn = (client, { companyId, employeeId }) =>
  client.from('time_entries')
    .insert({ company_id: companyId, employee_id: employeeId })
    .select('id, clock_in').single();

// Closes every open entry for the employee (race-safe, no stale ids).
export const clockOut = (client, employeeId) =>
  client.from('time_entries')
    .update({ clock_out: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .is('clock_out', null);

export const closeEntryById = (client, entryId) =>
  client.from('time_entries')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', entryId)
    .is('clock_out', null);

/* ── issues & messages ───────────────────────────────────────────── */

export const fetchIssues = (client) =>
  client.from('issues')
    .select('id, body, photo_path, created_at, reply, replied_at, resolved_at, author:profiles ( full_name )')
    .order('created_at', { ascending: false })
    .then(({ data, error }) => ({
      data: data?.map(r => ({
        id: r.id, text: r.body, meta: timeMeta(r.created_at),
        createdAt: r.created_at,
        author: r.author?.full_name ?? '',
        photoPath: r.photo_path ?? null,
        reply: r.reply ?? null,
        repliedAt: r.replied_at ?? null,
        resolvedAt: r.resolved_at ?? null,
      })) ?? null,
      error,
    }));

export const addIssue = (client, { companyId, authorId, body, photoPath = null }) =>
  client.from('issues').insert({ company_id: companyId, author_id: authorId, body, photo_path: photoPath });

// One manager reply per issue; the field app shows it under the report.
export const replyToIssue = (client, { id, reply, repliedBy }) =>
  client.from('issues')
    .update({ reply, replied_by: repliedBy, replied_at: new Date().toISOString() })
    .eq('id', id);

export const setIssueResolved = (client, id, resolved) =>
  client.from('issues')
    .update({ resolved_at: resolved ? new Date().toISOString() : null })
    .eq('id', id);

export const fetchMessages = (client, threadId) =>
  client.from('messages')
    .select('id, body, sender_id, created_at, sender:profiles!messages_sender_id_fkey ( full_name, role )')
    .eq('thread_id', threadId)
    .order('created_at')
    .then(({ data, error }) => ({
      data: data?.map(r => ({
        id: r.id,
        text: r.body,
        senderId: r.sender_id,
        senderName: r.sender?.full_name ?? '',
        senderRole: r.sender?.role ?? 'crew',
        createdAt: r.created_at,
      })) ?? null,
      error,
    }));

export const sendMessage = (client, { companyId, threadId, senderId, body }) =>
  client.from('messages').insert({
    company_id: companyId, thread_id: threadId, sender_id: senderId, body,
  });

/* ── invites (manager) ───────────────────────────────────────────── */

const genCode = () => {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
  let c = '';
  for (let i = 0; i < 6; i++) c += abc[Math.floor(Math.random() * abc.length)];
  return c;
};

export const createInvite = (client, { companyId, createdBy, role = 'crew' }) =>
  client.from('invites')
    .insert({ code: genCode(), company_id: companyId, created_by: createdBy, role })
    .select('code, role, created_at').single();

export const fetchInvites = (client) =>
  client.from('invites')
    .select('code, role, created_at, used_at, used_by')
    .order('created_at', { ascending: false });

export const fetchTeam = (client) =>
  client.from('profiles')
    .select('id, full_name, role, active, created_at')
    .order('created_at')
    .then(({ data, error }) => ({
      data: data?.map(p => ({
        id: p.id, name: p.full_name, role: p.role,
        active: p.active, initials: initials(p.full_name),
      })) ?? null,
      error,
    }));

/* ── clients ─────────────────────────────────────────────────────── */

const mapClient = r => ({
  id: r.id, name: r.name, address: r.address,
  frequency: r.frequency, notes: r.notes,
});

export const fetchClients = (client) =>
  client.from('clients')
    .select('id, name, address, frequency, notes, created_at')
    .order('name')
    .then(({ data, error }) => ({ data: data?.map(mapClient) ?? null, error }));

export const addClient = (client, { companyId, name, address = '', frequency = '', notes = '' }) =>
  client.from('clients')
    .insert({ company_id: companyId, name, address, frequency, notes })
    .select('id, name, address, frequency, notes').single()
    .then(({ data, error }) => ({ data: data ? mapClient(data) : null, error }));

export const updateClient = (client, id, { name, address, frequency, notes }) =>
  client.from('clients').update({ name, address, frequency, notes }).eq('id', id);

export const deleteClient = (client, id) =>
  client.from('clients').delete().eq('id', id);

/* ── checklist templates ─────────────────────────────────────────── */

const mapTemplate = r => ({
  id: r.id,
  name: r.name,
  photoPolicy: r.photo_policy,
  items: [...(r.template_items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(i => ({ id: i.id, label: i.label })),
});

const TEMPLATE_SELECT = `id, name, photo_policy,
  template_items ( id, label, position )`;

export const fetchTemplates = (client) =>
  client.from('checklist_templates')
    .select(TEMPLATE_SELECT)
    .order('name')
    .then(({ data, error }) => ({ data: data?.map(mapTemplate) ?? null, error }));

async function replaceTemplateItems(client, { companyId, templateId, itemLabels }) {
  // Insert the new items BEFORE removing the old ones (these are separate
  // writes, not a transaction). A failed insert then leaves the existing
  // items intact instead of wiping the template; the worst case on a delete
  // failure is stale duplicates, not silent data loss.
  const { data: existing, error: exErr } = await client.from('template_items')
    .select('id').eq('template_id', templateId);
  if (exErr) return { error: exErr };
  const items = itemLabels.map((label, i) => ({
    template_id: templateId, company_id: companyId, label, position: i + 1,
  }));
  if (items.length) {
    const { error: iErr } = await client.from('template_items').insert(items);
    if (iErr) return { error: iErr };
  }
  const oldIds = (existing ?? []).map(r => r.id);
  if (oldIds.length) {
    const { error: dErr } = await client.from('template_items').delete().in('id', oldIds);
    if (dErr) return { error: dErr };
  }
  return { error: null };
}

export async function addTemplate(client, { companyId, name, photoPolicy = '', itemLabels }) {
  const { data: t, error } = await client.from('checklist_templates')
    .insert({ company_id: companyId, name, photo_policy: photoPolicy })
    .select('id').single();
  if (error) return { error };
  const { error: iErr } = await replaceTemplateItems(client, { companyId, templateId: t.id, itemLabels });
  if (iErr) return { error: iErr };
  return { data: t, error: null };
}

export async function updateTemplate(client, { companyId, id, name, photoPolicy = '', itemLabels }) {
  const { error } = await client.from('checklist_templates')
    .update({ name, photo_policy: photoPolicy }).eq('id', id);
  if (error) return { error };
  return replaceTemplateItems(client, { companyId, templateId: id, itemLabels });
}

export const deleteTemplate = (client, id) =>
  client.from('checklist_templates').delete().eq('id', id);

/* ── time entries (timesheets & reports) ─────────────────────────── */

// Raw entries since `sinceISO`; callers join names via their team list and
// aggregate with entryHours(). company_id RLS scopes this to the caller.
export const fetchTimeEntries = (client, sinceISO) =>
  client.from('time_entries')
    .select('id, employee_id, clock_in, clock_out')
    .gte('clock_in', sinceISO)
    .order('clock_in')
    .then(({ data, error }) => ({
      data: data?.map(r => ({
        id: r.id, employeeId: r.employee_id,
        clockIn: r.clock_in, clockOut: r.clock_out,
      })) ?? null,
      error,
    }));

/* ── realtime ────────────────────────────────────────────────────── */

// Subscribe to every table that drives UI; `handlers` maps table name →
// callback. Returns an unsubscribe function. Call AFTER sign-in so the
// channel carries the user's access token (RLS applies to realtime).
export function subscribeCompany(client, companyId, handlers) {
  const filter = `company_id=eq.${companyId}`;
  let channel = client.channel(`company-${companyId}`);
  for (const table of ['jobs', 'checklist_items', 'issues', 'messages', 'time_entries', 'profiles', 'invites', 'clients', 'checklist_templates', 'template_items']) {
    if (handlers[table]) {
      channel = channel.on('postgres_changes',
        { event: '*', schema: 'public', table, filter },
        handlers[table]);
    }
  }
  channel.subscribe();
  return () => { client.removeChannel(channel); };
}

// Per-table fetch ticketing: only the most recently started refetch may
// apply its result, so a stale response resolving last can't overwrite
// newer data. `fetcher` returns { data, error }; `apply` receives data.
export function makeTicketed() {
  const seq = {};
  return (key, fetcher, apply) => async (...args) => {
    seq[key] = (seq[key] ?? 0) + 1;
    const ticket = seq[key];
    const { data, error } = await fetcher(...args);
    if (ticket !== seq[key]) return { stale: true };
    if (!error && data != null) apply(data);
    return { data, error };
  };
}
