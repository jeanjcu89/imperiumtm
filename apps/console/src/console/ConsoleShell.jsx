import React, { useState } from 'react';
import { initials } from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import { useData } from '../DataContext.jsx';
import { navEntries, tabTitles } from './sampleData.js';
import NewJobModal from './NewJobModal.jsx';
import InboxTab from './InboxTab.jsx';
import {
  DashboardTab, JobsTab, TeamTab, ReviewTab, HoursTab,
  ClientsTab, ScheduleTab, TemplatesTab, ReportsTab,
} from './tabs.jsx';

const franklin = "'Libre Franklin',sans-serif";

const TAB_VIEWS = {
  dashboard: DashboardTab,
  schedule: ScheduleTab,
  jobs: JobsTab,
  team: TeamTab,
  review: ReviewTab,
  inbox: InboxTab,
  hours: HoursTab,
  clients: ClientsTab,
  templates: TemplatesTab,
  reports: ReportsTab,
};

// Inbox sits right after Review in the nav.
const NAV_ENTRIES = navEntries.flatMap(e =>
  e[0] === 'review' ? [e, ['inbox', 'Inbox']] : [e]);

const TAB_TITLES = {
  ...tabTitles,
  inbox: ['Inbox', 'Chat threads with your crew'],
};

// Tabs still running on the storyboard's static data.
const SAMPLE_TABS = new Set(['schedule', 'hours', 'clients', 'templates', 'reports']);

function Sidebar({ tab, setTab }) {
  const { profile, signOut } = useAuth();
  const { jobs } = useData();
  const reviewCount = jobs.filter(j => j.status === 'submitted').length;

  return (
    <div style={{
      flex: 'none', width: 220, background: '#3a2c20', color: '#e8ddce',
      display: 'flex', flexDirection: 'column', padding: '18px 14px', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 6px 18px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: '#d96b2b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: franklin, fontWeight: 800, fontSize: 16,
        }}>I</div>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, color: '#fff' }}>Imperium</div>
      </div>
      {NAV_ENTRIES.map(([key, label]) => {
        const on = tab === key;
        const hasBadge = key === 'review' && reviewCount > 0;
        return (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
            border: 'none', cursor: 'pointer', borderRadius: 9, padding: '9px 11px', marginBottom: 2,
            fontSize: 13.5, fontWeight: on ? 700 : 500,
            background: on ? '#4a3928' : 'transparent', color: on ? '#fff' : '#c9b8a3',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? '#d96b2b' : '#6b5642', flex: 'none' }} />
            <span style={{ flex: 1 }}>{label}</span>
            {hasBadge && (
              <span style={{ background: '#d96b2b', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>{reviewCount}</span>
            )}
          </button>
        );
      })}
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#5a4736', flex: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#f3e2d2',
          }}>{initials(profile.fullName)}</div>
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div style={{
              fontSize: 12.5, fontWeight: 600, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{profile.fullName}</div>
            <div style={{
              fontSize: 10.5, color: '#b6a48f',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{profile.companyName}</div>
          </div>
        </div>
        <button onClick={signOut} style={{
          marginTop: 10, width: '100%', border: '1px solid rgba(255,255,255,.14)',
          background: 'transparent', color: '#c9b8a3', fontSize: 12, fontWeight: 600,
          borderRadius: 9, padding: '8px 0', cursor: 'pointer',
        }}>Sign out</button>
      </div>
    </div>
  );
}

export default function ConsoleShell() {
  const { ready } = useData();
  const [tab, setTab] = useState('dashboard');
  const [showNewJob, setShowNewJob] = useState(false);

  const [title, subBase] = TAB_TITLES[tab];
  const sub = SAMPLE_TABS.has(tab) ? subBase + ' · sample data' : subBase;
  const View = TAB_VIEWS[tab];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#faf7f2', color: '#2a211b' }}>
      <Sidebar tab={tab} setTab={setTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', background: '#fff', borderBottom: '1px solid #ece5db',
        }}>
          <div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#a1927f', marginTop: 2 }}>{sub}</div>
          </div>
          <button onClick={() => setShowNewJob(true)} style={{
            border: 'none', background: '#d96b2b', color: '#fff', fontWeight: 700,
            fontSize: 12.5, borderRadius: 9, padding: '9px 15px', cursor: 'pointer',
          }}>+ New job</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 30px' }}>
          {ready
            ? <View />
            : <div style={{ color: '#a1927f', fontSize: 13 }}>Loading live data…</div>}
        </div>
      </div>
      {showNewJob && <NewJobModal onClose={() => setShowNewJob(false)} />}
    </div>
  );
}
