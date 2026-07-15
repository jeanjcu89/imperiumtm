import React, { useEffect, useMemo, useState } from 'react';
import {
  statusMeta, prog, timeMeta, getPhotoUrl, initials,
  ymd, startOfWeek, addDays, entryHours,
} from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import { useData } from '../DataContext.jsx';
import useIsMobile from '../useIsMobile.js';
import ClientModal from './ClientModal.jsx';
import TemplateModal from './TemplateModal.jsx';

const franklin = "'Libre Franklin',sans-serif";
const card = { background: '#fff', border: '1px solid #ece5db', borderRadius: 14 };

/* ── week navigation (Hours & Schedule) ────────────────────────────── */

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Returns the Monday-anchored week for the current offset plus controls.
// `minOffset` clamps how far back you can page — Hours passes it so you can't
// scroll past the fetched time-entry window and see a false "no hours" week.
function useWeek({ minOffset = -Infinity } = {}) {
  const [offset, setOffset] = useState(0);
  const monday = useMemo(() => addDays(startOfWeek(new Date()), offset * 7), [offset]);
  const days = useMemo(() => DAY_NAMES.map((name, i) => {
    const date = addDays(monday, i);
    return { name, date, key: ymd(date) };
  }), [monday]);
  const label = offset === 0
    ? 'This week'
    : `${addDays(monday, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${addDays(monday, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  return {
    days, label, offset, atMin: offset <= minOffset,
    prev: () => setOffset(o => Math.max(minOffset, o - 1)),
    next: () => setOffset(o => o + 1),
    reset: () => setOffset(0),
  };
}

// Prev / next / today control shared by Hours (weeks) and Schedule (weeks or
// months). No outer margin — callers place it (Hours wraps it, Schedule drops
// it in a toolbar).
function PeriodNav({ label, offset, atMin = false, onPrev, onNext, onReset, unit = 'week' }) {
  const btn = {
    border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
    fontWeight: 700, fontSize: 13, borderRadius: 8, width: 30, height: 30,
    lineHeight: 1,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onPrev} disabled={atMin} style={{ ...btn, cursor: atMin ? 'default' : 'pointer', opacity: atMin ? 0.4 : 1 }} aria-label={`Previous ${unit}`}>‹</button>
      <button onClick={onNext} style={{ ...btn, cursor: 'pointer' }} aria-label={`Next ${unit}`}>›</button>
      <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 14 }}>{label}</div>
      {offset !== 0 && (
        <button onClick={onReset} style={{
          border: 'none', background: 'transparent', color: '#b85618',
          fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: '4px 6px',
        }}>Today</button>
      )}
    </div>
  );
}

// Calendar weeks (Monday-first) covering the offset month, each day flagged
// inMonth / isToday. Jobs are fetched unwindowed, so there's no back/forward
// clamp here (unlike Hours' 6-week window).
function useMonth() {
  const [offset, setOffset] = useState(0);
  const base = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);                      // set day before month to avoid overflow
    d.setMonth(d.getMonth() + offset);
    return d;
  }, [offset]);
  const weeks = useMemo(() => {
    const month = base.getMonth();
    const lastOfMonth = new Date(base.getFullYear(), month + 1, 0);
    const todayKey = ymd(new Date());
    const out = [];
    let cursor = startOfWeek(base);    // Monday on/before the 1st
    while (true) {
      const wk = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(cursor, i);
        wk.push({ date, key: ymd(date), inMonth: date.getMonth() === month, isToday: ymd(date) === todayKey });
      }
      out.push(wk);
      cursor = addDays(cursor, 7);
      if (cursor > lastOfMonth) break;
    }
    return out;
  }, [base]);
  const label = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return {
    weeks, label, offset,
    prev: () => setOffset(o => o - 1),
    next: () => setOffset(o => o + 1),
    reset: () => setOffset(0),
  };
}

const emptyState = (title, sub) => (
  <div style={{ ...card, padding: 50, textAlign: 'center', color: '#a1927f' }}>
    <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16, color: '#2a211b' }}>{title}</div>
    <div style={{ fontSize: 13, marginTop: 6 }}>{sub}</div>
  </div>
);

/* ── Dashboard (live) ──────────────────────────────────────── */

export function DashboardTab() {
  const { jobs, team, issues } = useData();
  const isMobile = useIsMobile();
  const activeCount = jobs.filter(j => j.status === 'inprogress' || j.status === 'todo').length;
  const approvedCount = jobs.filter(j => j.status === 'approved').length;
  const reviewCount = jobs.filter(j => j.status === 'submitted').length;
  const crewCount = team.filter(p => p.role === 'crew').length;
  const stats = [
    { label: 'Active jobs', value: String(activeCount), sub: `across ${crewCount} crew`, color: '#d96b2b' },
    { label: 'Completed', value: String(approvedCount), sub: 'approved', color: '#4f8a5b' },
    { label: 'Pending review', value: String(reviewCount), sub: 'need approval', color: '#c9922b' },
    { label: 'Hours logged', value: '—', sub: 'this week', color: '#3a2c20' },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: isMobile ? 13 : 16 }}>
            <div style={{ fontSize: 11, color: '#a1927f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: isMobile ? 26 : 30, marginTop: 8, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: '#8a7d70', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 16 }}>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Live job board</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {jobs.length === 0 && (
              <div style={{ fontSize: 12.5, color: '#a1927f', padding: '8px 2px' }}>No jobs yet — create one with “+ New job”.</div>
            )}
            {jobs.map(job => {
              const p = prog(job);
              const m = statusMeta(job.status);
              return (
                <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', border: '1px solid #f0e7dc', borderRadius: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.fg, flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{job.client}</div>
                    <div style={{ fontSize: 11, color: '#a1927f' }}>{job.employee}{job.time ? ` · ${job.time}` : ''}</div>
                  </div>
                  <div style={{ width: 90, height: 6, background: '#f0e7dc', borderRadius: 6, overflow: 'hidden', flex: 'none' }}>
                    <div style={{ height: '100%', width: p.pct, background: '#d96b2b' }} />
                  </div>
                  <div style={{ flex: 'none', width: 92, textAlign: 'right', fontSize: 10.5, fontWeight: 700, color: m.fg, textTransform: 'uppercase' }}>{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {issues.length === 0 && (
              <div style={{ fontSize: 12.5, color: '#a1927f' }}>No issues reported yet.</div>
            )}
            {issues.slice(0, 8).map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 11 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c9922b', marginTop: 5, flex: 'none' }} />
                <div style={{ lineHeight: 1.4 }}>
                  <span style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{a.author}</span> {a.text}
                  </span>
                  <div style={{ fontSize: 10.5, color: '#a1927f', fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Jobs (live) ───────────────────────────────────────────── */

const jobsGrid = '1.5fr 1.6fr 1fr .8fr 1fr .9fr 28px';

export function JobsTab() {
  const { jobs, deleteJob } = useData();
  const isMobile = useIsMobile();
  const [error, setError] = useState('');

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.client}"? This removes its checklist and photos link — it can't be undone.`)) return;
    setError('');
    const { error: err } = (await deleteJob(job.id)) ?? {};
    if (err) setError(`Could not delete — ${err.message}`);
  };

  if (jobs.length === 0) {
    return (
      <div style={{ ...card, padding: 50, textAlign: 'center', color: '#a1927f' }}>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16, color: '#2a211b' }}>No jobs yet</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Create your first job with the “+ New job” button above.</div>
      </div>
    );
  }

  // Phone layout: one card per job instead of the seven-column table.
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {error && (
          <div style={{ ...card, padding: '10px 14px', color: '#b85618', fontSize: 12.5, fontWeight: 600 }}>{error}</div>
        )}
        {jobs.map(job => {
          const p = prog(job);
          const m = statusMeta(job.status);
          return (
            <div key={job.id} style={{ ...card, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{job.client}</div>
                  <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 2 }}>{job.address}</div>
                  <div style={{ fontSize: 11.5, color: '#a1927f', marginTop: 4 }}>
                    {job.employee}{job.time ? ` · ${job.time}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
                    background: m.bg, color: m.fg, textTransform: 'uppercase',
                  }}>{m.label}</span>
                  <button onClick={() => remove(job)} title="Delete job" style={{
                    border: 'none', background: 'transparent', color: '#c9b8a3',
                    fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 4,
                  }}>×</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
                <div style={{ flex: 1, height: 6, background: '#f0e7dc', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: p.pct, background: '#d96b2b' }} />
                </div>
                <span style={{ fontSize: 11, color: '#a1927f' }}>{p.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      {error && (
        <div style={{ padding: '10px 18px', color: '#b85618', fontSize: 12.5, fontWeight: 600, borderBottom: '1px solid #f4ede3' }}>{error}</div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: jobsGrid, gap: 12, padding: '12px 18px',
        background: '#faf7f2', borderBottom: '1px solid #ece5db',
        fontSize: 11, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em',
      }}>
        <div>Client</div><div>Location</div><div>Assigned</div><div>Time</div><div>Progress</div><div>Status</div><div />
      </div>
      {jobs.map(job => {
        const p = prog(job);
        const m = statusMeta(job.status);
        return (
          <div key={job.id} style={{
            display: 'grid', gridTemplateColumns: jobsGrid, gap: 12, padding: '14px 18px',
            borderBottom: '1px solid #f4ede3', alignItems: 'center', fontSize: 13,
          }}>
            <div style={{ fontWeight: 600 }}>{job.client}</div>
            <div style={{ color: '#8a7d70', fontSize: 12 }}>{job.address}</div>
            <div>{job.employee}</div>
            <div style={{ color: '#8a7d70', fontSize: 12 }}>{job.time}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ flex: 1, height: 6, background: '#f0e7dc', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: p.pct, background: '#d96b2b' }} />
              </div>
              <span style={{ fontSize: 11, color: '#a1927f' }}>{p.text}</span>
            </div>
            <div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
                background: m.bg, color: m.fg, textTransform: 'uppercase',
              }}>{m.label}</span>
            </div>
            <button onClick={() => remove(job)} title="Delete job" style={{
              border: 'none', background: 'transparent', color: '#c9b8a3',
              fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 4,
            }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Team (live) ───────────────────────────────────────────── */

const roleLabel = (role) => role === 'manager' ? 'Manager' : 'Crew';

function InviteCodesCard() {
  const { invites, createInvite } = useData();
  const [local, setLocal] = useState([]);   // optimistic: codes created this session
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const generate = async (role) => {
    if (busy) return;
    setBusy(role); setError('');
    const { data, error: err } = await createInvite(role);
    if (err) setError(err.message);
    else if (data) setLocal(l => [{ used_at: null, used_by: null, ...data }, ...l]);
    setBusy(null);
  };

  // Realtime refetch reconciles; drop local copies once the server list has them.
  const merged = [
    ...local.filter(l => !invites.some(i => i.code === l.code)),
    ...invites,
  ];
  const unused = merged.filter(i => !i.used_at);
  const used = merged.filter(i => i.used_at);

  const genBtn = (role, label) => (
    <button onClick={() => generate(role)} disabled={!!busy} style={{
      border: role === 'crew' ? 'none' : '1px solid #e0d3c2',
      background: role === 'crew' ? '#d96b2b' : '#fff',
      color: role === 'crew' ? '#fff' : '#8a7d70',
      fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 14px',
      cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
    }}>{busy === role ? 'Generating…' : label}</button>
  );

  return (
    <div style={{ ...card, padding: 18, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15 }}>Invite codes</div>
          <div style={{ fontSize: 11.5, color: '#a1927f', marginTop: 3 }}>
            Crew enter their code in the Imperium field app; managers use theirs
            on this console's sign-in page ("Have an invite code?").
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          {genBtn('crew', 'Generate crew invite')}
          {genBtn('manager', 'Generate manager invite')}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12.5, color: '#b85618', marginTop: 12 }}>{error}</div>
      )}

      {unused.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {unused.map(i => (
            <div key={i.code} style={{
              border: '1px solid #f0e7dc', background: '#faf7f2', borderRadius: 11,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{
                fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 17,
                letterSpacing: '.12em', color: '#3a2c20',
              }}>{i.code}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderRadius: 20,
                padding: '3px 8px', background: '#f3e2d2', color: '#b85618',
              }}>{roleLabel(i.role)}</span>
            </div>
          ))}
        </div>
      )}
      {unused.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#a1927f', marginTop: 16 }}>
          No unused codes. Generate one to invite a teammate.
        </div>
      )}

      {used.length > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid #f4ede3', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Used</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {used.map(i => (
              <div key={i.code} style={{ fontSize: 12, color: '#a1927f' }}>
                <span style={{ fontFamily: 'ui-monospace,monospace', letterSpacing: '.1em' }}>{i.code}</span>
                {' · '}{roleLabel(i.role)}{' · used '}{timeMeta(i.used_at)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TeamTab() {
  const { team } = useData();
  const isMobile = useIsMobile();

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 10 : 14 }}>
        {team.map(p => (
          <div key={p.id} style={{ ...card, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#f3e2d2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#b85618',
              }}>{p.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: '#a1927f' }}>{roleLabel(p.role)}</div>
              </div>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.active ? '#4f8a5b' : '#d8c5ad' }} />
            </div>
          </div>
        ))}
      </div>
      <InviteCodesCard />
    </>
  );
}

/* ── Review (live, real photos) ────────────────────────────── */

const photoPlaceholder = {
  height: 92, borderRadius: 10, border: '1px solid #e4d6c4',
  backgroundImage: 'repeating-linear-gradient(135deg,#e9dccd 0 9px,#f3ebdf 9px 18px)',
};

function ItemPhoto({ path }) {
  const { client } = useAuth();
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!client || !path) return undefined;
    getPhotoUrl(client, path).then(({ data }) => {
      if (!cancelled && data) setUrl(data);
    });
    return () => { cancelled = true; };
  }, [client, path]);

  if (!url) return <div style={photoPlaceholder} />;
  return (
    <img src={url} alt="" style={{
      width: '100%', height: 92, objectFit: 'cover', borderRadius: 10,
      border: '1px solid #e4d6c4', display: 'block',
    }} />
  );
}

export function ReviewTab() {
  const { jobs, approveJob, rejectJob } = useData();
  const isMobile = useIsMobile();
  // Optimistic: hide a job the moment the manager acts; the realtime
  // refetch reconciles the real status shortly after.
  const [acted, setActed] = useState({});
  const [error, setError] = useState('');

  // Prune optimistic entries once the job's status reconciles away from
  // 'submitted' — this also lets re-submitted jobs reappear in the queue.
  useEffect(() => {
    setActed(a => {
      const next = Object.fromEntries(Object.entries(a).filter(([id]) =>
        jobs.some(j => j.id === id && j.status === 'submitted')));
      return Object.keys(next).length === Object.keys(a).length ? a : next;
    });
  }, [jobs]);

  const reviewJobs = jobs.filter(j => j.status === 'submitted' && !acted[j.id]);

  const act = async (fn, id, what) => {
    setError('');
    setActed(a => ({ ...a, [id]: true }));
    const { error: err } = (await fn(id)) ?? {};
    if (err) {
      // Un-hide the card and tell the manager — a failed write emits no
      // realtime event, so nothing else would correct the optimistic hide.
      setActed(a => { const { [id]: _drop, ...rest } = a; return rest; });
      setError(`Could not ${what} — ${err.message}`);
    }
  };

  const errorBanner = error && (
    <div style={{
      ...card, padding: '12px 16px', marginBottom: 14, borderColor: '#e8c9b0',
      color: '#b85618', fontSize: 13, fontWeight: 600,
    }}>{error}</div>
  );

  if (reviewJobs.length === 0) {
    return (
      <>
        {errorBanner}
        <div style={{ ...card, padding: 50, textAlign: 'center', color: '#a1927f' }}>
          <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16, color: '#2a211b' }}>All caught up</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>No submissions waiting for review.</div>
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {errorBanner}
      {reviewJobs.map(job => (
        <div key={job.id} style={{ ...card, padding: isMobile ? 14 : 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 16 }}>{job.client}</div>
              <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 2 }}>{job.address} · submitted by {job.employee}</div>
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={() => act(rejectJob, job.id, 'send the job back')} style={{
                border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
                fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 16px', cursor: 'pointer',
              }}>Send back</button>
              <button onClick={() => act(approveJob, job.id, 'approve the job')} style={{
                border: 'none', background: '#4f8a5b', color: '#fff',
                fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 18px', cursor: 'pointer',
              }}>Approve</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10 }}>
            {job.items.map(item => (
              <div key={item.id}>
                <ItemPhoto path={item.photoPath} />
                <div style={{ fontSize: 11, color: '#8a7d70', marginTop: 5, lineHeight: 1.3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Hours (live: aggregated from time entries) ────────────── */

const hoursGrid = '1.4fr repeat(7,1fr) .9fr';
const fmtHours = h => h > 0 ? h.toFixed(1) : '—';

export function HoursTab() {
  const { team, timeEntries } = useData();
  // DataContext fetches six weeks of entries; don't let the manager page past
  // that window and misread an unfetched week as "no hours".
  const { days, ...week } = useWeek({ minOffset: -6 });

  // Attribute each entry's hours to the local weekday of its clock-in.
  // rows: employeeId → { [dayKey]: hours }
  const byEmployee = useMemo(() => {
    const acc = {};
    const dayKeys = new Set(days.map(d => d.key));
    for (const e of timeEntries) {
      const key = ymd(new Date(e.clockIn));
      if (!dayKeys.has(key)) continue;
      (acc[e.employeeId] ??= {});
      acc[e.employeeId][key] = (acc[e.employeeId][key] ?? 0) + entryHours(e);
    }
    return acc;
  }, [timeEntries, days]);

  const rows = team
    .map(p => {
      const perDay = byEmployee[p.id] ?? {};
      const total = days.reduce((s, d) => s + (perDay[d.key] ?? 0), 0);
      return { id: p.id, name: p.name, perDay, total };
    })
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <PeriodNav label={week.label} offset={week.offset} atMin={week.atMin} onPrev={week.prev} onNext={week.next} onReset={week.reset} />
      </div>
      {rows.length === 0
        ? emptyState('No hours this week', 'Crew hours appear here once they clock in and out from the field app.')
        : (
          <div style={{ ...card, overflowX: 'auto' }}>
            <div style={{ minWidth: 760 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: hoursGrid, gap: 8, padding: '12px 18px',
                background: '#faf7f2', borderBottom: '1px solid #ece5db',
                fontSize: 11, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em',
              }}>
                <div>Employee</div>
                {days.map(d => <div key={d.key}>{d.name}</div>)}
                <div>Total</div>
              </div>
              {rows.map(row => (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: hoursGrid, gap: 8, padding: '14px 18px',
                  borderBottom: '1px solid #f4ede3', alignItems: 'center', fontSize: 13,
                }}>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  {days.map(d => (
                    <div key={d.key} style={{ color: '#8a7d70' }}>{fmtHours(row.perDay[d.key] ?? 0)}</div>
                  ))}
                  <div style={{ fontWeight: 800, fontFamily: franklin }}>{row.total.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );
}

/* ── Clients (live CRUD) ───────────────────────────────────── */

const addCard = (label, onClick) => (
  <div onClick={onClick} style={{
    border: '1.5px dashed #d8c5ad', borderRadius: 14, padding: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#b85618', fontWeight: 700, fontSize: 13, cursor: 'pointer', minHeight: 120, background: '#fdfbf7',
  }}>{label}</div>
);

export function ClientsTab() {
  const { clients, deleteClient, jobs } = useData();
  const isMobile = useIsMobile();
  const [modal, setModal] = useState(null); // null | { client } | {} (add)
  const [error, setError] = useState('');

  const jobCount = (clientId) => jobs.filter(j => j.clientId === clientId).length;

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? Its jobs stay, but they'll no longer be linked to this client.`)) return;
    setError('');
    const { error: err } = (await deleteClient(c.id)) ?? {};
    if (err) setError(`Could not delete — ${err.message}`);
  };

  return (
    <>
      {error && (
        <div style={{ ...card, padding: '10px 14px', marginBottom: 12, color: '#b85618', fontSize: 12.5, fontWeight: 600 }}>{error}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 14 }}>
        {clients.map(c => {
          const count = jobCount(c.id);
          return (
            <div key={c.id} style={{ ...card, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  {c.address && <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 3 }}>{c.address}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                  {c.frequency && (
                    <span style={{ fontSize: 10.5, color: '#b85618', fontWeight: 700, background: '#f3e2d2', padding: '4px 9px', borderRadius: 20 }}>{c.frequency}</span>
                  )}
                </div>
              </div>
              {c.notes && <div style={{ marginTop: 12, fontSize: 12, color: '#8a7d70', lineHeight: 1.5 }}>{c.notes}</div>}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f4ede3', paddingTop: 11 }}>
                <span style={{ fontSize: 11, color: '#a1927f' }}>
                  {count === 0 ? 'No jobs yet' : `${count} job${count === 1 ? '' : 's'}`}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setModal({ client: c })} style={{
                    border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
                    fontWeight: 700, fontSize: 11.5, borderRadius: 8, padding: '5px 11px', cursor: 'pointer',
                  }}>Edit</button>
                  <button onClick={() => remove(c)} style={{
                    border: '1px solid #e7d3c0', background: '#fff', color: '#b85618',
                    fontWeight: 700, fontSize: 11.5, borderRadius: 8, padding: '5px 11px', cursor: 'pointer',
                  }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {addCard('+ New client', () => setModal({}))}
      </div>
      {modal && <ClientModal client={modal.client} onClose={() => setModal(null)} />}
    </>
  );
}

/* ── Schedule (live: week grid or month calendar, with filters) ─────── */

const scheduleGrid = '1.4fr repeat(7,1fr)';
const monthGrid = 'repeat(7, minmax(0, 1fr))';
const UNASSIGNED = '__unassigned__';

const stBg = (status) => statusMeta(status).bg;
const stFg = (status) => statusMeta(status).fg;
const statusLabel = (s) => s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
// Tooltip: who's on the job, its time and estimate — the detail the compact
// chips don't have room to show inline.
const jobTip = (j) => [j.employee, j.time, j.estimatedHours ? `${j.estimatedHours}h` : ''].filter(Boolean).join(' · ');

const filterSelect = {
  border: '1px solid #e0d3c2', background: '#fff', color: '#3a2c20',
  fontSize: 12.5, fontWeight: 600, borderRadius: 8, padding: '7px 10px',
  cursor: 'pointer', outline: 'none', maxWidth: 170,
};

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid #e0d3c2', borderRadius: 8, overflow: 'hidden', flex: 'none' }}>
      {options.map(o => {
        const on = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: 'none', background: on ? '#d96b2b' : '#fff', color: on ? '#fff' : '#8a7d70',
            fontWeight: 700, fontSize: 12.5, padding: '7px 14px', cursor: 'pointer',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// Week grid: crew (rows) × day (columns). `jobs` is already filtered; empty
// cells on assignable rows open a pre-filled New Job.
function ScheduleWeek({ days, jobs, team, workerFilter, filtered, openNewJob }) {
  const dayKeys = useMemo(() => new Set(days.map(d => d.key)), [days]);
  const group = useMemo(() => {
    const g = {};
    for (const j of jobs) {
      if (!dayKeys.has(j.scheduledDate)) continue;
      const who = j.assigneeId ?? UNASSIGNED;
      ((g[who] ??= {})[j.scheduledDate] ??= []).push(j);
    }
    return g;
  }, [jobs, dayKeys]);

  const rows = useMemo(() => {
    const has = new Set(Object.keys(group));
    let list = team
      .filter(p => p.role === 'crew' || has.has(p.id))
      .map(p => ({ id: p.id, name: p.name, initials: p.initials }));
    if (has.has(UNASSIGNED)) list.push({ id: UNASSIGNED, name: 'Unassigned', initials: '—' });
    // A worker filter narrows to just that person's (or the Unassigned) row.
    if (workerFilter) list = list.filter(r => r.id === workerFilter);
    return list;
  }, [team, group, workerFilter]);

  if (rows.length === 0) {
    return filtered
      ? emptyState('No jobs match', 'No scheduled jobs match these filters this week. Clear them or try another week.')
      : emptyState('No crew yet', 'Invite crew from the Team tab, then schedule their jobs here or with “+ New job”.');
  }

  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <div style={{ minWidth: 860 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: scheduleGrid, gap: 8, padding: '12px 18px',
          background: '#faf7f2', borderBottom: '1px solid #ece5db',
          fontSize: 11, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em',
        }}>
          <div>Crew</div>
          {days.map(d => <div key={d.key}>{d.name} {d.date.getDate()}</div>)}
        </div>
        {rows.map(row => (
          <div key={row.id} style={{
            display: 'grid', gridTemplateColumns: scheduleGrid, gap: 8, padding: '12px 18px',
            borderBottom: '1px solid #f4ede3', alignItems: 'stretch',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#f3e2d2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#b85618', flex: 'none',
              }}>{row.initials}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</span>
            </div>
            {days.map(d => {
              const cell = group[row.id]?.[d.key] ?? [];
              if (cell.length === 0) {
                const assignable = row.id !== UNASSIGNED && openNewJob;
                return (
                  <div key={d.key}
                    onClick={assignable ? () => openNewJob({ assigneeId: row.id, scheduledDate: d.key }) : undefined}
                    style={{
                      minHeight: 40, borderRadius: 8, background: '#faf7f2',
                      border: '1px dashed #ece1d2', cursor: assignable ? 'pointer' : 'default',
                    }} />
                );
              }
              return (
                <div key={d.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {cell.map(j => (
                    <div key={j.id} title={jobTip(j)} style={{
                      borderRadius: 8, background: stBg(j.status), color: stFg(j.status),
                      fontSize: 10.5, fontWeight: 600, padding: '7px 8px', lineHeight: 1.25,
                    }}>{j.client}{j.time ? ` · ${j.time}` : ''}{j.estimatedHours ? ` · ${j.estimatedHours}h` : ''}</div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Month calendar: a day cell per date, jobs (already filtered) shown as chips.
// Empty in-month cells open a pre-filled New Job on that day.
function ScheduleMonth({ weeks, jobs, openNewJob, prefillWorker }) {
  const byDay = useMemo(() => {
    const g = {};
    for (const j of jobs) (g[j.scheduledDate] ??= []).push(j);
    return g;
  }, [jobs]);

  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <div style={{ minWidth: 780 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: monthGrid,
          background: '#faf7f2', borderBottom: '1px solid #ece5db',
        }}>
          {DAY_NAMES.map(n => (
            <div key={n} style={{
              padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#a1927f',
              textTransform: 'uppercase', letterSpacing: '.05em',
            }}>{n}</div>
          ))}
        </div>
        {weeks.map((wk, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: monthGrid }}>
            {wk.map(day => {
              const list = byDay[day.key] ?? [];
              const canAdd = openNewJob && day.inMonth && list.length === 0;
              return (
                <div key={day.key}
                  onClick={canAdd ? () => openNewJob({ scheduledDate: day.key, assigneeId: prefillWorker }) : undefined}
                  style={{
                    minHeight: 96, padding: 7, borderRight: '1px solid #f4ede3', borderBottom: '1px solid #f4ede3',
                    background: day.inMonth ? '#fff' : '#faf8f4',
                    cursor: canAdd ? 'pointer' : 'default',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: day.isToday ? '#d96b2b' : 'transparent',
                      color: day.isToday ? '#fff' : (day.inMonth ? '#8a7d70' : '#c9b8a3'),
                    }}>{day.date.getDate()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {list.slice(0, 3).map(j => (
                      <div key={j.id} title={`${j.client} · ${jobTip(j)}`} style={{
                        borderRadius: 6, background: stBg(j.status), color: stFg(j.status),
                        fontSize: 10, fontWeight: 600, padding: '3px 6px', lineHeight: 1.2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{j.client}</div>
                    ))}
                    {list.length > 3 && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#a1927f', paddingLeft: 2 }}>+{list.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleTab({ openNewJob }) {
  const { jobs, team } = useData();
  const [view, setView] = useState('week');
  const [clientF, setClientF] = useState('');
  const [workerF, setWorkerF] = useState('');
  const [statusF, setStatusF] = useState('');
  const week = useWeek();
  const month = useMonth();

  const scheduled = useMemo(() => jobs.filter(j => j.scheduledDate), [jobs]);
  const clientOptions = useMemo(
    () => [...new Set(scheduled.map(j => j.client).filter(Boolean))].sort(), [scheduled]);
  const statusOptions = useMemo(
    () => [...new Set(scheduled.map(j => j.status))], [scheduled]);

  const filtered = useMemo(() => scheduled.filter(j =>
    (!clientF || j.client === clientF)
    && (!workerF || (workerF === UNASSIGNED ? !j.assigneeId : j.assigneeId === workerF))
    && (!statusF || j.status === statusF)
  ), [scheduled, clientF, workerF, statusF]);

  const anyFilter = !!(clientF || workerF || statusF);
  const prefillWorker = workerF && workerF !== UNASSIGNED ? workerF : undefined;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Segmented value={view} onChange={setView}
          options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
        {view === 'week'
          ? <PeriodNav unit="week" label={week.label} offset={week.offset} onPrev={week.prev} onNext={week.next} onReset={week.reset} />
          : <PeriodNav unit="month" label={month.label} offset={month.offset} onPrev={month.prev} onNext={month.next} onReset={month.reset} />}
        <div style={{ flex: 1, minWidth: 8 }} />
        <select style={filterSelect} value={clientF} onChange={e => setClientF(e.target.value)} aria-label="Filter by client">
          <option value="">All clients</option>
          {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={filterSelect} value={workerF} onChange={e => setWorkerF(e.target.value)} aria-label="Filter by worker">
          <option value="">All workers</option>
          {team.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value={UNASSIGNED}>Unassigned</option>
        </select>
        <select style={filterSelect} value={statusF} onChange={e => setStatusF(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {statusOptions.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        {anyFilter && (
          <button onClick={() => { setClientF(''); setWorkerF(''); setStatusF(''); }} style={{
            border: 'none', background: 'transparent', color: '#b85618',
            fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: '4px 6px',
          }}>Clear filters</button>
        )}
      </div>

      {view === 'week'
        ? <ScheduleWeek days={week.days} jobs={filtered} team={team} workerFilter={workerF} filtered={anyFilter} openNewJob={openNewJob} />
        : <ScheduleMonth weeks={month.weeks} jobs={filtered} openNewJob={openNewJob} prefillWorker={prefillWorker} />}
    </>
  );
}

/* ── Templates (live CRUD) ─────────────────────────────────── */

export function TemplatesTab() {
  const { templates, deleteTemplate, jobs } = useData();
  const isMobile = useIsMobile();
  const [modal, setModal] = useState(null); // null | { template } | {} (add)
  const [error, setError] = useState('');

  const useCount = (templateId) => jobs.filter(j => j.templateId === templateId).length;

  const remove = async (t) => {
    if (!window.confirm(`Delete the "${t.name}" template? Jobs already created from it keep their checklists.`)) return;
    setError('');
    const { error: err } = (await deleteTemplate(t.id)) ?? {};
    if (err) setError(`Could not delete — ${err.message}`);
  };

  return (
    <>
      {error && (
        <div style={{ ...card, padding: '10px 14px', marginBottom: 12, color: '#b85618', fontSize: 12.5, fontWeight: 600 }}>{error}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 14 }}>
        {templates.map(t => {
          const count = useCount(t.id);
          return (
            <div key={t.id} style={{ ...card, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                <div style={{ flex: 'none', fontSize: 10.5, color: '#b85618', fontWeight: 700, background: '#f3e2d2', padding: '4px 9px', borderRadius: 20 }}>
                  {t.items.length} task{t.items.length === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12.5, color: '#8a7d70', lineHeight: 1.5 }}>
                {t.items.map(i => i.label).join(' · ') || 'No tasks yet'}
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 11, color: '#a1927f', borderTop: '1px solid #f4ede3', paddingTop: 11 }}>
                <div style={{ display: 'flex', gap: 18 }}>
                  {t.photoPolicy && <div>Photos: <span style={{ color: '#3a2c20', fontWeight: 600 }}>{t.photoPolicy}</span></div>}
                  <div>In use: <span style={{ color: '#3a2c20', fontWeight: 600 }}>{count} job{count === 1 ? '' : 's'}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                  <button onClick={() => setModal({ template: t })} style={{
                    border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
                    fontWeight: 700, fontSize: 11.5, borderRadius: 8, padding: '5px 11px', cursor: 'pointer',
                  }}>Edit</button>
                  <button onClick={() => remove(t)} style={{
                    border: '1px solid #e7d3c0', background: '#fff', color: '#b85618',
                    fontWeight: 700, fontSize: 11.5, borderRadius: 8, padding: '5px 11px', cursor: 'pointer',
                  }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {addCard('+ New checklist template', () => setModal({}))}
      </div>
      {modal && <TemplateModal template={modal.template} onClose={() => setModal(null)} />}
    </>
  );
}

/* ── Reports (live: derived from jobs & time entries) ──────── */

export function ReportsTab() {
  const { jobs, timeEntries } = useData();
  const isMobile = useIsMobile();

  const { stats, bars } = useMemo(() => {
    const thisMonday = startOfWeek(new Date());
    const weekStart = thisMonday.getTime();
    const weekEnd = addDays(thisMonday, 7).getTime();
    const lastStart = addDays(thisMonday, -7).getTime();

    const approvedAt = j => j.approvedAt ? new Date(j.approvedAt).getTime() : null;
    const inRange = (t, a, b) => t != null && t >= a && t < b;

    const approvedThisWeek = jobs.filter(j => inRange(approvedAt(j), weekStart, weekEnd)).length;
    const approvedLastWeek = jobs.filter(j => inRange(approvedAt(j), lastStart, weekStart)).length;
    const delta = approvedThisWeek - approvedLastWeek;
    const approvedTrend = approvedLastWeek === 0
      ? (approvedThisWeek > 0 ? 'First approvals this week' : 'No approvals last week')
      : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} vs last week`;

    // Photo compliance: share of completed items that carry a photo.
    const doneItems = jobs.flatMap(j => j.items).filter(i => i.done);
    const withPhoto = doneItems.filter(i => i.photoPath).length;
    const compliance = doneItems.length === 0 ? null : Math.round(withPhoto / doneItems.length * 100);

    // Hours logged this week (open entries count up to now).
    const hoursThisWeek = timeEntries
      .filter(e => { const t = new Date(e.clockIn).getTime(); return t >= weekStart && t < weekEnd; })
      .reduce((s, e) => s + entryHours(e), 0);

    const stats = [
      { label: 'Approved this week', value: String(approvedThisWeek), trend: approvedTrend, up: delta >= 0 },
      { label: 'Photo compliance', value: compliance == null ? '—' : `${compliance}%`, trend: `${withPhoto}/${doneItems.length} items with a photo`, up: true },
      { label: 'Hours logged', value: hoursThisWeek > 0 ? `${hoursThisWeek.toFixed(1)} h` : '—', trend: 'this week', up: true },
    ];

    // Jobs approved per week, last 6 weeks.
    const buckets = [];
    for (let w = 5; w >= 0; w--) {
      const start = addDays(thisMonday, -7 * w);
      const end = addDays(start, 7);
      const count = jobs.filter(j => inRange(approvedAt(j), start.getTime(), end.getTime())).length;
      buckets.push({ label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count, current: w === 0 });
    }
    const max = Math.max(1, ...buckets.map(b => b.count));
    const bars = buckets.map(b => ({
      ...b,
      h: `${Math.round(b.count / max * 100)}%`,
      color: b.current ? '#d96b2b' : '#e6c3a3',
    }));

    return { stats, bars };
  }, [jobs, timeEntries]);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 10 : 14, marginBottom: 18 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#a1927f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 28, marginTop: 8 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: s.up ? '#4f8a5b' : '#b85618', fontWeight: 600, marginTop: 3 }}>{s.trend}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Jobs approved by week</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 170, padding: '0 6px' }}>
          {bars.map(b => (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a7d70' }}>{b.count > 0 ? b.count : ''}</div>
              <div style={{ width: '100%', maxWidth: 46, height: b.h, minHeight: b.count > 0 ? 4 : 0, background: b.color, borderRadius: '7px 7px 0 0' }} />
              <div style={{ fontSize: 11, color: '#a1927f', fontFamily: 'ui-monospace,monospace' }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
