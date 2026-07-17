import React from 'react';
import { startOfWeek, addDays } from '@imperium/shared';
import { AuthContext } from '../AuthContext.jsx';
import { DataContext } from '../DataContext.jsx';
import ConsoleShell from '../console/ConsoleShell.jsx';
import photoBreakroom from './photos/breakroom.jpg';
import photoDesks from './photos/desks.jpg';
import photoRestroom from './photos/restroom.jpg';
import photoCarpet from './photos/carpet.jpg';

// Dev-only design preview: renders the full console with mock data and
// no Supabase connection. Reachable ONLY in `npm run dev` via ?mock=1 —
// production builds never take this path (guarded in App.jsx).

const day = 86_400_000;
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();

// Sample proof photos: `snap` fabricates a storage path whose filename embeds
// today-at-h:m as the epoch-ms (what photoTimestamp reads) and registers the
// bundled image for it, so Review/Detail/Lightbox render real-looking proof.
const photoUrlByPath = {};
const snap = (jobId, itemId, url, h, m) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  const path = `mock-co/${jobId}/${itemId}-${d.getTime()}.jpg`;
  photoUrlByPath[path] = url;
  return path;
};

const jobs = [
  {
    id: 'j1', client: 'Riverside Dental', address: '210 Riverside Dr, Suite 5', time: '9:00 AM',
    assigneeId: 'crew-1', employee: 'Maria Santos', status: 'inprogress',
    items: [
      { id: 'a', label: 'Reception & waiting room', done: true, photoPath: snap('j1', 'a', photoCarpet, 9, 41) },
      { id: 'b', label: 'Restrooms sanitised', done: true, photoPath: snap('j1', 'b', photoRestroom, 10, 5) },
      { id: 'c', label: 'Treatment rooms wiped down', done: false, photoPath: null },
      { id: 'd', label: 'Floors mopped & bins emptied', done: false, photoPath: null },
    ],
  },
  {
    id: 'j2', client: 'Northgate Offices', address: '88 Northgate Ave, Floors 2–3', time: '12:30 PM',
    assigneeId: 'crew-2', employee: 'James Okoro', status: 'submitted',
    items: [
      { id: 'a', label: 'Kitchen & breakroom', done: true, photoPath: snap('j2', 'a', photoBreakroom, 14, 41) },
      { id: 'b', label: 'Desks & surfaces', done: true, photoPath: snap('j2', 'b', photoDesks, 14, 58) },
      { id: 'c', label: 'Restrooms sanitised', done: true, photoPath: snap('j2', 'c', photoRestroom, 15, 5) },
    ],
  },
  {
    id: 'j4', client: 'Harbor Law Group', address: '400 Harbor Blvd, 9th Floor', time: '8:00 AM',
    assigneeId: 'crew-3', employee: 'Priya Nair', status: 'approved',
    items: [
      { id: 'a', label: 'Conference rooms & glass', done: true, photoPath: snap('j4', 'a', photoDesks, 8, 20) },
      { id: 'b', label: 'Offices & workstations', done: true, photoPath: snap('j4', 'b', photoCarpet, 8, 47) },
      { id: 'c', label: 'Kitchen & breakroom', done: true, photoPath: snap('j4', 'c', photoBreakroom, 9, 10) },
      { id: 'd', label: 'Floors mopped & bins emptied', done: true, photoPath: snap('j4', 'd', photoRestroom, 9, 35) },
    ],
  },
  {
    id: 'j3', client: 'Bloom Café', address: '5 Market St', time: '4:00 PM',
    assigneeId: 'crew-1', employee: 'Maria Santos', status: 'todo',
    items: [
      { id: 'a', label: 'Front of house & windows', done: false, photoPath: null },
      { id: 'b', label: 'Kitchen deep clean', done: false, photoPath: null },
    ],
  },
];

const team = [
  { id: 'mgr-1', name: 'Dana Lowe', role: 'manager', active: true, initials: 'DL' },
  { id: 'crew-1', name: 'Maria Santos', role: 'crew', active: true, initials: 'MS' },
  { id: 'crew-2', name: 'James Okoro', role: 'crew', active: true, initials: 'JO' },
  { id: 'crew-3', name: 'Priya Nair', role: 'crew', active: true, initials: 'PN' },
];

// This week's closed shifts (26.5 h total) so Dashboard, Hours and Reports
// have real numbers to aggregate. Entries anchor to Monday so the totals
// don't drift as the mock is viewed on different weekdays.
const monday = startOfWeek(new Date());
const shift = (dayIdx, startHour, hours, employeeId) => {
  const start = new Date(addDays(monday, dayIdx));
  start.setHours(startHour, 0, 0, 0);
  return {
    id: `t-${employeeId}-${dayIdx}`, employeeId,
    clockIn: start.toISOString(),
    clockOut: new Date(start.getTime() + hours * 3_600_000).toISOString(),
  };
};

const timeEntries = [
  shift(0, 9, 4, 'crew-1'), shift(2, 9, 5, 'crew-1'), shift(4, 9, 2.5, 'crew-1'),
  shift(1, 12, 4, 'crew-2'), shift(3, 12, 4, 'crew-2'),
  shift(0, 8, 4, 'crew-3'), shift(2, 13, 3, 'crew-3'),
];

const issues = [
  { id: 1, text: 'Side door was locked — used loading dock instead.', meta: 'Today · 8:12 AM', author: 'Maria Santos' },
  { id: 2, text: 'Vacuum bag needs replacement at Northgate.', meta: 'Yesterday · 4:40 PM', author: 'James Okoro' },
];

const invites = [
  { code: 'KDX42P', role: 'crew', created_at: iso(2 * day), used_at: null, used_by: null },
  { code: 'MZQ7RW', role: 'crew', created_at: iso(5 * day), used_at: iso(4 * day), used_by: 'crew-2' },
];

const ok = async () => ({ data: null, error: null });

// Just enough Supabase surface for the mock preview: usePhotoUrl resolves
// bundled sample photos, Settings' company/referral fetches get static rows,
// and billingRequest sees "not signed in" instead of crashing.
const mockCompanyRow = {
  id: 'mock-co', name: 'Sparkle Cleaning Co.',
  address: '12 Market Street', phone: '(555) 010-2030',
};

// Chainable PostgREST-ish stub: every filter returns itself; awaiting the
// chain (or .single()) resolves with the canned result.
const mockQuery = ({ row = null, rows = [] } = {}) => {
  const q = {
    select: () => q, eq: () => q, order: () => q, is: () => q,
    gte: () => q, limit: () => q, in: () => q,
    update: () => q, insert: () => q, delete: () => q,
    single: () => Promise.resolve({ data: row, error: null }),
    maybeSingle: () => Promise.resolve({ data: row, error: null }),
    then: (res, rej) => Promise.resolve({ data: rows, error: null }).then(res, rej),
  };
  return q;
};

const mockClient = {
  storage: {
    from: () => ({
      createSignedUrl: async (path) => ({
        data: { signedUrl: photoUrlByPath[path] ?? null },
        error: null,
      }),
    }),
  },
  from: (t) => mockQuery(t === 'companies' ? { row: mockCompanyRow } : {}),
  rpc: async () => ({ data: null, error: null }),
  auth: {
    getSession: async () => ({ data: { session: null } }),
    updateUser: async () => ({ data: null, error: null }),
  },
};

const mockAuth = {
  client: mockClient,
  configured: true,
  session: { mock: true },
  // onboardedAt set so the getting-started card (which needs a live client
  // for its Dismiss write) stays out of the mock preview.
  profile: {
    id: 'mgr-1', companyId: 'mock-co', fullName: 'Dana Lowe', role: 'manager',
    active: true, companyName: 'Sparkle Cleaning Co.',
    email: 'dana@sparkle.example', onboardedAt: iso(30 * day),
    // Mid-trial so the sidebar chip and Plan & billing render in previews.
    plan: 'free', trialEndsAt: new Date(Date.now() + 14 * day).toISOString(),
    trialExtendedAt: null, referralCode: 'SPKL42',
  },
  loading: false,
  refreshProfile: ok,
  signIn: ok,
  signUpCompany: ok,
  signOut: ok,
};

const mockData = {
  ready: true,
  jobs, team, issues, invites,
  clients: [], templates: [], timeEntries,
  messagesVersion: 0,
  createJob: ok,
  approveJob: ok,
  rejectJob: ok,
  deleteJob: ok,
  addClient: ok, updateClient: ok, deleteClient: ok,
  addTemplate: ok, updateTemplate: ok, deleteTemplate: ok,
  replyToIssue: ok, setIssueResolved: ok, updateMember: ok, deleteInvite: ok,
  createInvite: async () => ({ data: { code: 'NEW1AB', role: 'crew', created_at: new Date().toISOString() }, error: null }),
};

export default function DevPreview() {
  return (
    <AuthContext.Provider value={mockAuth}>
      <DataContext.Provider value={mockData}>
        <ConsoleShell />
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}
