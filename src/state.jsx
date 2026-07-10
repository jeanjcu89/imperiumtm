import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './lib/supabase.js';

export const ME = 'Maria Santos';

// Built-in demo data — used as the initial (and, without Supabase
// credentials, the only) data source. Mirrors supabase/migrations/*_seed.sql.
const initialJobs = [
  {
    id: 'j1', client: 'Riverside Dental', address: '210 Riverside Dr, Suite 5', time: '9:00 AM', employee: 'Maria Santos', status: 'inprogress',
    items: [
      { id: 'j1a', label: 'Reception & waiting room', done: true, photo: true },
      { id: 'j1b', label: 'Restrooms sanitised', done: true, photo: true },
      { id: 'j1c', label: 'Treatment rooms wiped down', done: false, photo: false },
      { id: 'j1d', label: 'Floors mopped & bins emptied', done: false, photo: false },
    ],
  },
  {
    id: 'j2', client: 'Northgate Offices', address: '88 Northgate Ave, Floors 2–3', time: '12:30 PM', employee: 'Maria Santos', status: 'todo',
    items: [
      { id: 'j2a', label: 'Kitchen & breakroom', done: false, photo: false },
      { id: 'j2b', label: 'Desks & surfaces', done: false, photo: false },
      { id: 'j2c', label: 'Restrooms sanitised', done: false, photo: false },
      { id: 'j2d', label: 'Vacuum common areas', done: false, photo: false },
    ],
  },
  {
    id: 'j3', client: 'Bloom Café', address: '5 Market St', time: '4:00 PM', employee: 'Maria Santos', status: 'todo',
    items: [
      { id: 'j3a', label: 'Front of house & windows', done: false, photo: false },
      { id: 'j3b', label: 'Kitchen deep clean', done: false, photo: false },
      { id: 'j3c', label: 'Bins & recycling', done: false, photo: false },
    ],
  },
  {
    id: 'j4', client: 'Harbor Law Group', address: '400 Bay St, 11th Floor', time: '10:00 AM', employee: 'James Okoro', status: 'submitted',
    items: [
      { id: 'j4a', label: 'Conference rooms', done: true, photo: true },
      { id: 'j4b', label: 'Kitchen & lounge', done: true, photo: true },
      { id: 'j4c', label: 'Restrooms sanitised', done: true, photo: true },
      { id: 'j4d', label: 'Reception floors', done: true, photo: true },
    ],
  },
  {
    id: 'j5', client: 'Cedar Clinic', address: '77 Cedar Rd', time: '8:00 AM', employee: 'Priya Nair', status: 'approved',
    items: [
      { id: 'j5a', label: 'Exam rooms', done: true, photo: true },
      { id: 'j5b', label: 'Waiting area', done: true, photo: true },
      { id: 'j5c', label: 'Restrooms sanitised', done: true, photo: true },
    ],
  },
];

const initialIssues = [
  { text: 'Building 4 side door was locked — used loading dock instead.', meta: 'Yesterday · 4:12 PM' },
];

const initialMessages = [
  { text: 'Morning Maria — Northgate added a 3rd floor today.', who: 'Dispatch · 8:02 AM', mine: false },
  { text: 'Got it, heading there after Riverside.', who: 'You · 8:05 AM', mine: true },
];

export function statusMeta(s) {
  if (s === 'approved') return { label: 'Approved', bg: '#e2efe5', fg: '#4f8a5b' };
  if (s === 'submitted') return { label: 'In review', bg: '#f7ecd3', fg: '#c9922b' };
  if (s === 'inprogress') return { label: 'In progress', bg: '#f6e0d0', fg: '#d96b2b' };
  return { label: 'To do', bg: '#efe9e0', fg: '#8a7d70' };
}

export function prog(job) {
  const t = job.items.length;
  const d = job.items.filter(i => i.done).length;
  return { d, t, pct: Math.round(d / t * 100) + '%', text: d + '/' + t };
}

/* ── timestamp → display helpers (remote rows only) ────────── */

const fmtClock = ts => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function timeMeta(ts) {
  const d = new Date(ts);
  const now = new Date();
  const age = now - d;
  if (age >= 0 && age < 60_000) return 'Just now';
  if (d.toDateString() === now.toDateString()) return 'Today · ' + fmtClock(d);
  if (d.toDateString() === new Date(now.getTime() - 86_400_000).toDateString()) return 'Yesterday · ' + fmtClock(d);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + fmtClock(d);
}

function whoLabel(sender, ts) {
  const age = Date.now() - new Date(ts).getTime();
  return `${sender} · ${age >= 0 && age < 60_000 ? 'now' : fmtClock(ts)}`;
}

const logError = what => ({ error }) => {
  if (error) console.error(`[supabase] ${what}:`, error.message);
};

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [jobs, setJobsState] = useState(initialJobs);
  const [activeId, setActiveId] = useState('j1');
  const [mgrTab, setMgrTab] = useState('dashboard');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockStart, setClockStart] = useState(null);
  const [, setTick] = useState(0);
  // Bumped on every clock toggle so late clock-in insert responses
  // from a superseded toggle can be detected and discarded.
  const clockGen = useRef(0);
  // Per-table fetch tickets: only the most recently started refetch may
  // apply its snapshot, so an older (staler) response resolving last
  // can't overwrite newer data.
  const fetchSeq = useRef({ jobs: 0, issues: 0, messages: 0, clock: 0 });
  const [issues, setIssues] = useState(initialIssues);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    if (!clockedIn) return;
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [clockedIn]);

  /* ── remote sync ─────────────────────────────────────────── */

  useEffect(() => {
    if (!supabase) return;

    const fetchJobs = async () => {
      const ticket = ++fetchSeq.current.jobs;
      const { data, error } = await supabase
        .from('jobs')
        .select('id, client, address, time_label, employee, status, checklist_items ( id, label, done, photo, position )')
        .order('position');
      if (error) return logError('fetch jobs')({ error });
      if (ticket !== fetchSeq.current.jobs) return;
      setJobsState(data.map(row => ({
        id: row.id,
        client: row.client,
        address: row.address,
        time: row.time_label,
        employee: row.employee,
        status: row.status,
        items: [...row.checklist_items]
          .sort((a, b) => a.position - b.position)
          .map(({ id, label, done, photo }) => ({ id, label, done, photo })),
      })));
    };

    const fetchIssues = async () => {
      const ticket = ++fetchSeq.current.issues;
      const { data, error } = await supabase
        .from('issues')
        .select('body, created_at')
        .order('created_at', { ascending: false });
      if (error) return logError('fetch issues')({ error });
      if (ticket !== fetchSeq.current.issues) return;
      setIssues(data.map(r => ({ text: r.body, meta: timeMeta(r.created_at) })));
    };

    const fetchMessages = async () => {
      const ticket = ++fetchSeq.current.messages;
      const { data, error } = await supabase
        .from('messages')
        .select('body, sender, mine, created_at')
        .order('created_at');
      if (error) return logError('fetch messages')({ error });
      if (ticket !== fetchSeq.current.messages) return;
      setMessages(data.map(r => ({ text: r.body, who: whoLabel(r.sender, r.created_at), mine: r.mine })));
    };

    const fetchClock = async () => {
      const ticket = ++fetchSeq.current.clock;
      const { data, error } = await supabase
        .from('time_entries')
        .select('id, clock_in')
        .eq('employee', ME)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return logError('fetch clock')({ error });
      if (ticket !== fetchSeq.current.clock) return;
      if (data) {
        setClockedIn(true);
        setClockStart(new Date(data.clock_in).getTime());
      } else {
        setClockedIn(false);
        setClockStart(null);
      }
    };

    fetchJobs();
    fetchIssues();
    fetchMessages();
    fetchClock();

    const channel = supabase
      .channel('imperium-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, fetchJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, fetchIssues)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, fetchClock)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── mutations: optimistic local update + remote write ───── */

  const setJobs = (fn) => setJobsState(js => js.map(fn));

  const toggleClock = () => {
    const gen = ++clockGen.current;
    if (clockedIn) {
      setClockedIn(false);
      if (supabase) {
        // Close every open entry for me — immune to stale ids and to
        // clock-in inserts that are still in flight but already committed.
        supabase.from('time_entries').update({ clock_out: new Date().toISOString() })
          .eq('employee', ME).is('clock_out', null)
          .then(logError('clock out'));
      }
    } else {
      setClockedIn(true);
      setClockStart(Date.now());
      if (supabase) {
        supabase.from('time_entries').insert({ employee: ME }).select('id, clock_in').single()
          .then(({ data, error }) => {
            if (error) return logError('clock in')({ error });
            if (clockGen.current !== gen) {
              // The user toggled again while this insert was in flight;
              // close the row it created so no orphan entry stays open.
              supabase.from('time_entries').update({ clock_out: new Date().toISOString() })
                .eq('id', data.id).is('clock_out', null)
                .then(logError('close superseded entry'));
              return;
            }
            setClockStart(new Date(data.clock_in).getTime());
          });
      }
    }
  };

  const openJob = (id) => setActiveId(id);

  const toggleItem = (jobId, itemId) => {
    const job = jobs.find(j => j.id === jobId);
    const item = job && job.items.find(i => i.id === itemId);
    if (!item) return;
    const nextDone = !item.done;
    setJobs(j => j.id !== jobId ? j : {
      ...j,
      status: j.status === 'todo' ? 'inprogress' : j.status,
      items: j.items.map(x => x.id === itemId ? { ...x, done: nextDone } : x),
    });
    if (supabase) {
      supabase.from('checklist_items').update({ done: nextDone })
        .eq('id', itemId).eq('job_id', jobId).then(logError('toggle item'));
      if (job.status === 'todo') {
        supabase.from('jobs').update({ status: 'inprogress' }).eq('id', jobId).then(logError('start job'));
      }
    }
  };

  const capturePhoto = (jobId, itemId) => {
    setJobs(j => j.id !== jobId ? j : {
      ...j,
      items: j.items.map(x => x.id === itemId ? { ...x, photo: true } : x),
    });
    if (supabase) {
      supabase.from('checklist_items').update({ photo: true })
        .eq('id', itemId).eq('job_id', jobId).then(logError('capture photo'));
    }
  };

  const setJobStatus = (jobId, status, what) => {
    setJobs(j => j.id === jobId ? { ...j, status } : j);
    if (supabase) {
      supabase.from('jobs').update({ status }).eq('id', jobId).then(logError(what));
    }
  };

  const submitJob = (jobId) => setJobStatus(jobId, 'submitted', 'submit job');
  const approveJob = (jobId) => setJobStatus(jobId, 'approved', 'approve job');

  const rejectJob = (jobId) => {
    setJobs(j => j.id === jobId
      ? { ...j, status: 'inprogress', items: j.items.map(i => ({ ...i, done: false })) }
      : j);
    if (supabase) {
      supabase.from('jobs').update({ status: 'inprogress' }).eq('id', jobId).then(logError('send back'));
      supabase.from('checklist_items').update({ done: false }).eq('job_id', jobId).then(logError('reset items'));
    }
  };

  const addIssue = (text) => {
    setIssues(list => [{ text, meta: 'Just now' }, ...list]);
    if (supabase) {
      supabase.from('issues').insert({ body: text }).then(logError('add issue'));
    }
  };

  const sendMessage = (text) => {
    setMessages(list => [...list, { text, who: 'You · now', mine: true }]);
    if (supabase) {
      supabase.from('messages').insert({ body: text, sender: 'You', mine: true }).then(logError('send message'));
    }
  };

  /* ── derived clock readout ───────────────────────────────── */

  // Clamp at 0: the server-stamped clockStart can be ahead of a client
  // whose wall clock is behind the Supabase server's.
  let elapsed = 0;
  if (clockedIn && clockStart) elapsed = Math.max(0, Math.floor((Date.now() - clockStart) / 1000));
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor(elapsed % 3600 / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const clock = clockedIn
    ? { status: 'On the clock', timeStr: hh + ':' + mm + ':' + ss, hoursToday: '6.2 h', bg: '#3a2c20', fg: '#faf7f2', btnBg: '#d96b2b', btnFg: '#fff', btnLabel: 'Clock out' }
    : { status: 'Clocked out', timeStr: '—', hoursToday: '6.2 h', bg: '#fff', fg: '#2a211b', btnBg: '#3a2c20', btnFg: '#fff', btnLabel: 'Clock in' };

  const dateStr = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  const value = {
    dateStr, jobs, activeId, mgrTab, setMgrTab, clock, clockedIn,
    toggleClock, openJob, toggleItem, capturePhoto, submitJob, approveJob, rejectJob,
    issues, addIssue, messages, sendMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
