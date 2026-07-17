import React from 'react';
import { ymd } from '@imperium/shared';
import { AuthContext } from '../state/AuthContext.js';
import { DataContext } from '../state/DataContext.js';

// Dev-only design preview: renders the crew shell with mock data and no
// Supabase connection — the field mirror of the console's DevPreview.
// Reachable ONLY on web dev builds via ?mock=1 (guarded in App.js).

const today = ymd(new Date());
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();

const items = (labels, doneCount) =>
  labels.map((label, i) => ({ id: 'i' + i, label, done: i < doneCount, photoPath: null }));

const jobs = [
  {
    id: 'j1', client: 'Riverside Dental', address: '210 Riverside Dr, Suite 5',
    time: '9:00 AM', status: 'inprogress', assigneeId: 'crew-1',
    employee: 'Maria Santos', scheduledDate: today,
    items: items([
      'Reception & waiting room', 'Front desk & surfaces', 'Restrooms sanitised',
      'Treatment room 1', 'Treatment room 2', 'Treatment room 3',
      'Kitchen / breakroom', 'Windows & glass doors', 'Floors mopped',
      'Bins emptied & liners replaced',
    ], 6),
  },
  {
    id: 'j2', client: 'Bloom Café', address: '5 Market St',
    time: '4:00 PM', status: 'todo', assigneeId: 'crew-1',
    employee: 'Maria Santos', scheduledDate: today,
    items: items([
      'Front of house & tables', 'Espresso bar & counters', 'Display case glass',
      'Kitchen deep clean', 'Restroom sanitised', 'Windows & entry door',
      'Floors swept & mopped', 'Bins out & liners replaced',
    ], 0),
  },
];

const issues = [
  { id: 1, text: 'Side door was locked — used the loading dock instead.', meta: 'Today · 8:12 AM', author: 'Maria Santos', photoPath: null, replies: [] },
];

const ok = async () => ({ data: null, error: null });

const mockAuth = {
  client: null,
  configured: true,
  session: { mock: true },
  profile: {
    id: 'crew-1', companyId: 'mock-co', fullName: 'Maria Santos', role: 'crew',
    active: true, companyName: 'Sparkle Cleaning Co.', email: 'maria@sparkle.example',
  },
  loading: false,
  refreshProfile: ok,
  signIn: ok,
  signUpWithInvite: ok,
  signOut: ok,
};

const mockData = {
  ready: true,
  jobs, issues,
  messages: [],
  timeEntries: [],
  entry: { id: 'e1', clockIn: iso((2 * 60 + 14) * 60_000) },
  clockedIn: true,
  clockStart: iso((2 * 60 + 14) * 60_000),
  toggleItem: ok,
  submitJob: ok,
  uploadPhoto: ok,
  photoUrl: () => null,
  clockIn: ok,
  clockOut: ok,
  addIssue: ok,
  sendMessage: ok,
};

export function MockProviders({ children }) {
  return (
    <AuthContext.Provider value={mockAuth}>
      <DataContext.Provider value={mockData}>
        {children}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}
