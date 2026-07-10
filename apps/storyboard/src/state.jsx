import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const ME = 'Maria Santos';

const initialJobs = [
  {
    id: 'j1', client: 'Riverside Dental', address: '210 Riverside Dr, Suite 5', time: '9:00 AM', employee: 'Maria Santos', status: 'inprogress',
    items: [
      { id: 'a', label: 'Reception & waiting room', done: true, photo: true },
      { id: 'b', label: 'Restrooms sanitised', done: true, photo: true },
      { id: 'c', label: 'Treatment rooms wiped down', done: false, photo: false },
      { id: 'd', label: 'Floors mopped & bins emptied', done: false, photo: false },
    ],
  },
  {
    id: 'j2', client: 'Northgate Offices', address: '88 Northgate Ave, Floors 2–3', time: '12:30 PM', employee: 'Maria Santos', status: 'todo',
    items: [
      { id: 'a', label: 'Kitchen & breakroom', done: false, photo: false },
      { id: 'b', label: 'Desks & surfaces', done: false, photo: false },
      { id: 'c', label: 'Restrooms sanitised', done: false, photo: false },
      { id: 'd', label: 'Vacuum common areas', done: false, photo: false },
    ],
  },
  {
    id: 'j3', client: 'Bloom Café', address: '5 Market St', time: '4:00 PM', employee: 'Maria Santos', status: 'todo',
    items: [
      { id: 'a', label: 'Front of house & windows', done: false, photo: false },
      { id: 'b', label: 'Kitchen deep clean', done: false, photo: false },
      { id: 'c', label: 'Bins & recycling', done: false, photo: false },
    ],
  },
  {
    id: 'j4', client: 'Harbor Law Group', address: '400 Bay St, 11th Floor', time: '10:00 AM', employee: 'James Okoro', status: 'submitted',
    items: [
      { id: 'a', label: 'Conference rooms', done: true, photo: true },
      { id: 'b', label: 'Kitchen & lounge', done: true, photo: true },
      { id: 'c', label: 'Restrooms sanitised', done: true, photo: true },
      { id: 'd', label: 'Reception floors', done: true, photo: true },
    ],
  },
  {
    id: 'j5', client: 'Cedar Clinic', address: '77 Cedar Rd', time: '8:00 AM', employee: 'Priya Nair', status: 'approved',
    items: [
      { id: 'a', label: 'Exam rooms', done: true, photo: true },
      { id: 'b', label: 'Waiting area', done: true, photo: true },
      { id: 'c', label: 'Restrooms sanitised', done: true, photo: true },
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

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [jobs, setJobsState] = useState(initialJobs);
  const [activeId, setActiveId] = useState('j1');
  const [mgrTab, setMgrTab] = useState('dashboard');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockStart, setClockStart] = useState(null);
  const [, setTick] = useState(0);
  const [issues, setIssues] = useState(initialIssues);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    if (!clockedIn) return;
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [clockedIn]);

  const setJobs = (fn) => setJobsState(js => js.map(fn));

  const toggleClock = () => {
    setClockedIn(on => !on);
    if (!clockedIn) setClockStart(Date.now());
  };

  const openJob = (id) => setActiveId(id);

  const toggleItem = (jobId, itemId) => setJobs(j => j.id !== jobId ? j : {
    ...j,
    status: j.status === 'todo' ? 'inprogress' : j.status,
    items: j.items.map(x => x.id === itemId ? { ...x, done: !x.done } : x),
  });

  const capturePhoto = (jobId, itemId) => setJobs(j => j.id !== jobId ? j : {
    ...j,
    items: j.items.map(x => x.id === itemId ? { ...x, photo: true } : x),
  });

  const submitJob = (jobId) => setJobs(j => j.id === jobId ? { ...j, status: 'submitted' } : j);
  const approveJob = (jobId) => setJobs(j => j.id === jobId ? { ...j, status: 'approved' } : j);
  const rejectJob = (jobId) => setJobs(j => j.id === jobId
    ? { ...j, status: 'inprogress', items: j.items.map(i => ({ ...i, done: false })) }
    : j);

  const addIssue = (text) => setIssues(list => [{ text, meta: 'Just now' }, ...list]);
  const sendMessage = (text) => setMessages(list => [...list, { text, who: 'You · now', mine: true }]);

  // clock readout
  let elapsed = 0;
  if (clockedIn && clockStart) elapsed = Math.floor((Date.now() - clockStart) / 1000);
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
