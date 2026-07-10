import React from 'react';
import ChromeWindow from '../frames/ChromeWindow.jsx';
import { useApp } from '../state.jsx';
import { navEntries, tabTitles } from '../data.js';
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
  hours: HoursTab,
  clients: ClientsTab,
  templates: TemplatesTab,
  reports: ReportsTab,
};

function Sidebar() {
  const { jobs, mgrTab, setMgrTab } = useApp();
  const reviewCount = jobs.filter(j => j.status === 'submitted').length;

  return (
    <div style={{
      flex: 'none', width: 220, background: '#3a2c20', color: '#e8ddce',
      display: 'flex', flexDirection: 'column', padding: '18px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 6px 18px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: '#d96b2b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: franklin, fontWeight: 800, fontSize: 16,
        }}>I</div>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, color: '#fff' }}>Imperium</div>
      </div>
      {navEntries.map(([key, label]) => {
        const on = mgrTab === key;
        const hasBadge = key === 'review' && reviewCount > 0;
        return (
          <button key={key} onClick={() => setMgrTab(key)} style={{
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
      <div style={{
        marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 9,
        padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,.08)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#5a4736',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#f3e2d2',
        }}>DL</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>Dana Lowe</div>
          <div style={{ fontSize: 10.5, color: '#b6a48f' }}>Operations lead</div>
        </div>
      </div>
    </div>
  );
}

export default function ManagerConsole() {
  const { mgrTab } = useApp();
  const [title, sub] = tabTitles[mgrTab];
  const View = TAB_VIEWS[mgrTab];

  return (
    <ChromeWindow width={1080} height={760} url={`app.imperium.io/${mgrTab}`}>
      <div style={{ display: 'flex', height: '100%', background: '#faf7f2', fontFamily: 'system-ui,sans-serif', color: '#2a211b' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{
            flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', background: '#fff', borderBottom: '1px solid #ece5db',
          }}>
            <div>
              <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#a1927f', marginTop: 2 }}>{sub}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                border: '1px solid #ece5db', borderRadius: 9, padding: '8px 12px',
                fontSize: 12.5, color: '#a1927f', background: '#faf7f2', width: 200,
              }}>Search jobs, staff…</div>
              <button style={{
                border: 'none', background: '#d96b2b', color: '#fff', fontWeight: 700,
                fontSize: 12.5, borderRadius: 9, padding: '9px 15px', cursor: 'pointer',
              }}>+ New job</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 30px' }}>
            <View />
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}
