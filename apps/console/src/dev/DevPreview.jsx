import React from 'react';
import { AuthContext } from '../AuthContext.jsx';
import { DataContext } from '../DataContext.jsx';
import ConsoleShell from '../console/ConsoleShell.jsx';

// Dev-only design preview: renders the full console with mock data and
// no Supabase connection. Reachable ONLY in `npm run dev` via ?mock=1 —
// production builds never take this path (guarded in App.jsx).

const day = 86_400_000;
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();

const jobs = [
  {
    id: 'j1', client: 'Riverside Dental', address: '210 Riverside Dr, Suite 5', time: '9:00 AM',
    assigneeId: 'crew-1', employee: 'Maria Santos', status: 'inprogress',
    items: [
      { id: 'a', label: 'Reception & waiting room', done: true, photoPath: null },
      { id: 'b', label: 'Restrooms sanitised', done: true, photoPath: null },
      { id: 'c', label: 'Treatment rooms wiped down', done: false, photoPath: null },
      { id: 'd', label: 'Floors mopped & bins emptied', done: false, photoPath: null },
    ],
  },
  {
    id: 'j2', client: 'Northgate Offices', address: '88 Northgate Ave, Floors 2–3', time: '12:30 PM',
    assigneeId: 'crew-2', employee: 'James Okoro', status: 'submitted',
    items: [
      { id: 'a', label: 'Kitchen & breakroom', done: true, photoPath: null },
      { id: 'b', label: 'Desks & surfaces', done: true, photoPath: null },
      { id: 'c', label: 'Restrooms sanitised', done: true, photoPath: null },
      { id: 'd', label: 'Vacuum common areas', done: true, photoPath: null },
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
  { id: 'crew-3', name: 'Priya Nair', role: 'crew', active: false, initials: 'PN' },
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

const mockAuth = {
  client: null,
  configured: true,
  session: { mock: true },
  // onboardedAt set so the getting-started card (which needs a live client
  // for its Dismiss write) stays out of the mock preview.
  profile: {
    id: 'mgr-1', companyId: 'mock-co', fullName: 'Dana Lowe', role: 'manager',
    active: true, companyName: 'Sparkle Cleaning Co.',
    email: 'dana@sparkle.example', onboardedAt: iso(30 * day),
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
  clients: [], templates: [], timeEntries: [],
  messagesVersion: 0,
  createJob: ok,
  approveJob: ok,
  rejectJob: ok,
  deleteJob: ok,
  addClient: ok, updateClient: ok, deleteClient: ok,
  addTemplate: ok, updateTemplate: ok, deleteTemplate: ok,
  replyToIssue: ok, setIssueResolved: ok, updateMember: ok,
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
