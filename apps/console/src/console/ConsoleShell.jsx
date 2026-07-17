import React, { useEffect, useRef, useState } from 'react';
import { initials, planInfo } from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import { useData } from '../DataContext.jsx';
import { billingRequest } from '../lib/billing.js';
import useIsMobile from '../useIsMobile.js';
import { navEntries, tabTitles } from './sampleData.js';
import BrandMark from '../BrandMark.jsx';
import NewJobModal from './NewJobModal.jsx';
import InboxTab from './InboxTab.jsx';
import IssuesTab from './IssuesTab.jsx';
import HelpTab from './HelpTab.jsx';
import SettingsTab from './SettingsTab.jsx';
import TourCard from './TourCard.jsx';
import { setOnboarded } from '@imperium/shared';
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
  issues: IssuesTab,
  inbox: InboxTab,
  hours: HoursTab,
  clients: ClientsTab,
  templates: TemplatesTab,
  reports: ReportsTab,
  help: HelpTab,
  settings: SettingsTab,
};

// Inbox sits right after Issues in the nav (review · issues · inbox).
const NAV_ENTRIES = navEntries.flatMap(e =>
  e[0] === 'issues' ? [e, ['inbox', 'Inbox']] : [e]);

const TAB_TITLES = {
  ...tabTitles,
  inbox: ['Inbox', 'Chat threads with your crew'],
};

// The URL hash holds `tab` or `tab/param` (e.g. jobs/<jobId>), so a reload or
// back/forward keeps the manager where they were, and views can deep-link
// (Dashboard job board → that job's detail).
const routeFromHash = () => {
  const [key, param] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (!TAB_VIEWS[key]) return { tab: 'dashboard', param: null };
  if (!param) return { tab: key, param: null };
  // A malformed %-escape (hand-edited or truncated link) must not throw out
  // of the useState initializer and white-screen the app — fall back to the
  // raw param; an unknown id just shows the view's own "not found" state.
  try {
    return { tab: key, param: decodeURIComponent(param) };
  } catch {
    return { tab: key, param };
  }
};

// Plan status pinned above the user card on every tab. Pro gets a quiet
// confirmation badge; trial and free ALWAYS carry an explicit upgrade
// call-to-action. Hidden only on pre-v11 databases (plan unknown).
function PlanChip({ onOpen }) {
  const { profile } = useAuth();
  const plan = planInfo(profile);
  if (!plan) return null;

  if (plan.isPaid) {
    return (
      <button onClick={onOpen} title="Plan & billing" style={{
        display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left',
        border: 'none', borderRadius: 9, padding: '7px 11px', marginBottom: 8,
        cursor: 'pointer', background: '#4a3928', color: '#a9cbae',
        fontSize: 11.5, fontWeight: 700,
      }}>
        <span style={{ fontWeight: 800 }}>✓</span> Pro plan
      </button>
    );
  }

  const urgent = plan.isFree || plan.trialDaysLeft <= 7;
  return (
    <button onClick={onOpen} title="Plan & billing" style={{
      display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
      border: 'none', borderRadius: 9, padding: '8px 11px', marginBottom: 8,
      background: '#4a3928',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: urgent ? '#f0a35e' : '#c9b8a3' }}>
        {plan.onTrial
          ? `Pro trial · ${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? '' : 's'} left`
          : 'Free plan'}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#f0a35e', marginTop: 2 }}>
        Upgrade to Pro →
      </div>
    </button>
  );
}

function Sidebar({ tab, setTab, onNavigate }) {
  const { profile, signOut } = useAuth();
  const { jobs, issues } = useData();
  const reviewCount = jobs.filter(j => j.status === 'submitted').length;
  const openIssues = issues.filter(i => !i.resolvedAt).length;
  const badgeFor = (key) =>
    key === 'review' ? reviewCount : key === 'issues' ? openIssues : 0;

  return (
    <div style={{
      flex: 'none', width: 220, background: '#3a2c20', color: '#e8ddce',
      display: 'flex', flexDirection: 'column', padding: '18px 14px', overflowY: 'auto',
      height: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 6px 18px' }}>
        <BrandMark size={30} tile radius={8} />
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, color: '#fff' }}>Imperium</div>
      </div>
      {NAV_ENTRIES.map(([key, label]) => {
        const on = tab === key;
        const badge = badgeFor(key);
        return (
          <button key={key} onClick={() => { setTab(key); if (onNavigate) onNavigate(); }} style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
            border: 'none', cursor: 'pointer', borderRadius: 9, padding: '9px 11px', marginBottom: 2,
            fontSize: 13.5, fontWeight: on ? 700 : 500,
            background: on ? '#4a3928' : 'transparent', color: on ? '#fff' : '#c9b8a3',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? '#d96b2b' : '#6b5642', flex: 'none' }} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span style={{ background: '#d96b2b', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>{badge}</span>
            )}
          </button>
        );
      })}
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <PlanChip onOpen={() => { setTab('settings'); if (onNavigate) onNavigate(); }} />
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
  const { client, profile, refreshProfile } = useAuth();
  const { ready, team } = useData();
  const isMobile = useIsMobile();
  const [route, setRoute] = useState(routeFromHash);
  // null = closed; an object (possibly empty) = open, carrying modal prefill.
  const [newJob, setNewJob] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // null = no tour; a number = the current tour step.
  const [tourStep, setTourStep] = useState(null);

  const startTour = () => setTourStep(0);
  // Finishing or skipping marks the manager onboarded, so the dashboard's
  // getting-started card stops nagging; Help keeps a replay button. If the
  // write fails the card simply remains, and its own Dismiss surfaces errors.
  const endTour = async () => {
    setTourStep(null);
    if (!profile.onboardedAt) {
      const { error } = (await setOnboarded(client, profile.id)) ?? {};
      if (error) { console.warn('[tour] onboarded flag not saved:', error.message); return; }
      refreshProfile();
    }
  };

  // Returning from Stripe Checkout (/?billing=success#settings): the webhook
  // flips the plan server-side, so poll the profile until Pro appears. This
  // lives in the shell — not BillingSection — so navigating away from
  // Settings can't strand the app on stale free/trial state.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('billing') !== 'success') {
      if (q.has('billing')) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      return;
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      const { data } = (await refreshProfile()) ?? {};
      if (data?.plan === 'pro' || tries >= 10) clearInterval(t);
    }, 3000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pro seat quantity follows the active crew count. Team changes arrive
  // here via realtime (member edits AND invite signups), so this stays
  // correct whichever tab the manager is on; sync-seats recounts server-side
  // and no-ops when nothing changed.
  const crewActive = team.filter(p => p.role === 'crew' && p.active).length;
  const seatSyncRef = useRef(null);
  useEffect(() => {
    if (!ready || profile?.plan !== 'pro') return;
    if (seatSyncRef.current === crewActive) return;
    seatSyncRef.current = crewActive;
    billingRequest(client, 'sync-seats').catch(() => {});
  }, [ready, crewActive, profile?.plan, client]);

  // Writing the hash keeps the route through a refresh; the hashchange
  // listener keeps state in sync when back/forward moves the hash.
  const navigateTo = (key, param = null) => {
    const h = param ? `${key}/${encodeURIComponent(param)}` : key;
    if (window.location.hash.replace(/^#\/?/, '') !== h) window.location.hash = h;
    setRoute({ tab: key, param });
  };
  const setTab = (key) => navigateTo(key);
  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { tab, param } = route;
  const [title, sub] = TAB_TITLES[tab];
  const View = TAB_VIEWS[tab];
  const openNewJob = (prefill) => setNewJob(prefill || {});

  return (
    <div className="vh-shell" style={{ display: 'flex', background: '#faf7f2', color: '#2a211b' }}>
      {!isMobile && <Sidebar tab={tab} setTab={setTab} />}

      {/* mobile drawer */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(42,33,27,.5)' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, bottom: 0, left: 0 }}>
            <Sidebar tab={tab} setTab={setTab} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, padding: isMobile ? '10px 12px' : '16px 24px',
          background: '#fff', borderBottom: '1px solid #ece5db',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} aria-label="Menu" style={{
                border: '1px solid #ece5db', background: '#faf7f2', borderRadius: 9,
                width: 38, height: 38, cursor: 'pointer', flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, color: '#3a2c20', lineHeight: 1,
              }}>☰</button>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: franklin, fontWeight: 800, fontSize: isMobile ? 17 : 20, lineHeight: 1.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{title}</div>
              <div style={{
                fontSize: isMobile ? 11 : 12, color: '#a1927f', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{sub}</div>
            </div>
          </div>
          <button onClick={() => openNewJob()} style={{
            border: 'none', background: '#d96b2b', color: '#fff', fontWeight: 700,
            fontSize: 12.5, borderRadius: 9, padding: '9px 15px', cursor: 'pointer', flex: 'none',
          }}>+ New job</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 12px 24px' : '22px 24px 30px' }}>
          {ready
            ? <View openNewJob={openNewJob} param={param} navigateTo={navigateTo} startTour={startTour} />
            : <div style={{ color: '#a1927f', fontSize: 13 }}>Loading live data…</div>}
        </div>
      </div>
      {newJob && <NewJobModal prefill={newJob} onClose={() => setNewJob(null)} />}
      {tourStep !== null && (
        <TourCard step={tourStep} setStep={setTourStep} navigateTo={navigateTo} onEnd={endTour} />
      )}
    </div>
  );
}
