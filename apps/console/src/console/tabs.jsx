import React, { useEffect, useState } from 'react';
import { statusMeta, prog, timeMeta, getPhotoUrl } from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import { useData } from '../DataContext.jsx';
import useIsMobile from '../useIsMobile.js';
import { timesheet, clients, reportStats, reportBars, schedule, templates } from './sampleData.js';

const franklin = "'Libre Franklin',sans-serif";
const card = { background: '#fff', border: '1px solid #ece5db', borderRadius: 14 };

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

/* ── Hours (sample data) ───────────────────────────────────── */

const hoursGrid = '1.4fr repeat(5,1fr) .9fr';

export function HoursTab() {
  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <div style={{ minWidth: 620 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: hoursGrid, gap: 8, padding: '12px 18px',
          background: '#faf7f2', borderBottom: '1px solid #ece5db',
          fontSize: 11, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em',
        }}>
          <div>Employee</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Total</div>
        </div>
        {timesheet.map(row => (
          <div key={row.name} style={{
            display: 'grid', gridTemplateColumns: hoursGrid, gap: 8, padding: '14px 18px',
            borderBottom: '1px solid #f4ede3', alignItems: 'center', fontSize: 13,
          }}>
            <div style={{ fontWeight: 600 }}>{row.name}</div>
            <div style={{ color: '#8a7d70' }}>{row.mon}</div>
            <div style={{ color: '#8a7d70' }}>{row.tue}</div>
            <div style={{ color: '#8a7d70' }}>{row.wed}</div>
            <div style={{ color: '#8a7d70' }}>{row.thu}</div>
            <div style={{ color: '#8a7d70' }}>{row.fri}</div>
            <div style={{ fontWeight: 800, fontFamily: franklin }}>{row.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Clients (sample data) ─────────────────────────────────── */

export function ClientsTab() {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 14 }}>
      {clients.map(c => (
        <div key={c.name} style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 3 }}>{c.locations}</div>
            </div>
            <div style={{ fontSize: 10.5, color: '#b85618', fontWeight: 700, background: '#f3e2d2', padding: '4px 9px', borderRadius: 20 }}>{c.freq}</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#8a7d70', lineHeight: 1.5 }}>{c.detail}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Schedule (sample data) ────────────────────────────────── */

const scheduleGrid = '1.4fr repeat(5,1fr)';

export function ScheduleTab() {
  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <div style={{ minWidth: 640 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: scheduleGrid, gap: 8, padding: '12px 18px',
        background: '#faf7f2', borderBottom: '1px solid #ece5db',
        fontSize: 11, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em',
      }}>
        <div>Crew</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div>
      </div>
      {schedule.map(row => (
        <div key={row.name} style={{
          display: 'grid', gridTemplateColumns: scheduleGrid, gap: 8, padding: '12px 18px',
          borderBottom: '1px solid #f4ede3', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: '#f3e2d2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#b85618', flex: 'none',
            }}>{row.initials}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</span>
          </div>
          {row.days.map((d, i) => (
            <div key={i} style={{
              minHeight: 36, borderRadius: 8, background: d.bg, color: d.fg,
              fontSize: 10.5, fontWeight: 600, padding: '7px 8px',
              display: 'flex', alignItems: 'center', lineHeight: 1.25,
            }}>{d.label}</div>
          ))}
        </div>
      ))}
      </div>
    </div>
  );
}

/* ── Templates (sample data) ───────────────────────────────── */

export function TemplatesTab() {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 14 }}>
      {templates.map(t => (
        <div key={t.name} style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15 }}>{t.name}</div>
            <div style={{ flex: 'none', fontSize: 10.5, color: '#b85618', fontWeight: 700, background: '#f3e2d2', padding: '4px 9px', borderRadius: 20 }}>{t.count}</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: '#8a7d70', lineHeight: 1.5 }}>{t.items}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 18, fontSize: 11, color: '#a1927f', borderTop: '1px solid #f4ede3', paddingTop: 11 }}>
            <div>Photos: <span style={{ color: '#3a2c20', fontWeight: 600 }}>{t.photos}</span></div>
            <div>In use: <span style={{ color: '#3a2c20', fontWeight: 600 }}>{t.uses}</span></div>
          </div>
        </div>
      ))}
      <div style={{
        border: '1.5px dashed #d8c5ad', borderRadius: 14, padding: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#b85618', fontWeight: 700, fontSize: 13, cursor: 'pointer', minHeight: 120, background: '#fdfbf7',
      }}>+ New checklist template</div>
    </div>
  );
}

/* ── Reports (sample data) ─────────────────────────────────── */

export function ReportsTab() {
  const isMobile = useIsMobile();
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 10 : 14, marginBottom: 18 }}>
        {reportStats.map(s => (
          <div key={s.label} style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#a1927f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 28, marginTop: 8 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: '#4f8a5b', fontWeight: 600, marginTop: 3 }}>{s.trend}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Jobs completed by week</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 170, padding: '0 6px' }}>
          {reportBars.map(b => (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', maxWidth: 46, height: b.h, background: b.color, borderRadius: '7px 7px 0 0' }} />
              <div style={{ fontSize: 11, color: '#a1927f', fontFamily: 'ui-monospace,monospace' }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
