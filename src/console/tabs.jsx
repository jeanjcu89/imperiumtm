import React from 'react';
import { useApp, statusMeta, prog } from '../state.jsx';
import { activity, team, timesheet, clients, reportStats, reportBars, schedule, templates } from '../data.js';

const franklin = "'Libre Franklin',sans-serif";
const card = { background: '#fff', border: '1px solid #ece5db', borderRadius: 14 };

/* ── Dashboard ─────────────────────────────────────────────── */

export function DashboardTab() {
  const { jobs } = useApp();
  const activeCount = jobs.filter(j => j.status === 'inprogress' || j.status === 'todo').length;
  const approvedCount = jobs.filter(j => j.status === 'approved').length;
  const reviewCount = jobs.filter(j => j.status === 'submitted').length;
  const stats = [
    { label: 'Active jobs', value: String(activeCount), sub: 'across 3 crew', color: '#d96b2b' },
    { label: 'Completed today', value: String(approvedCount), sub: 'approved', color: '#4f8a5b' },
    { label: 'Pending review', value: String(reviewCount), sub: 'need approval', color: '#c9922b' },
    { label: 'Hours logged', value: '27.4', sub: 'this week', color: '#3a2c20' },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#a1927f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 30, marginTop: 8, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: '#8a7d70', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Live job board</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {jobs.map(job => {
              const p = prog(job);
              const m = statusMeta(job.status);
              return (
                <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', border: '1px solid #f0e7dc', borderRadius: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.fg, flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{job.client}</div>
                    <div style={{ fontSize: 11, color: '#a1927f' }}>{job.employee} · {job.time}</div>
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
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 11 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.dot, marginTop: 5, flex: 'none' }} />
                <div style={{ lineHeight: 1.4 }}>
                  <span style={{ fontSize: 13 }}>{a.text}</span>
                  <div style={{ fontSize: 10.5, color: '#a1927f', fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Jobs ──────────────────────────────────────────────────── */

const jobsGrid = '1.5fr 1.6fr 1fr .8fr 1fr .9fr';

export function JobsTab() {
  const { jobs } = useApp();
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: jobsGrid, gap: 12, padding: '12px 18px',
        background: '#faf7f2', borderBottom: '1px solid #ece5db',
        fontSize: 11, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em',
      }}>
        <div>Client</div><div>Location</div><div>Assigned</div><div>Time</div><div>Progress</div><div>Status</div>
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
          </div>
        );
      })}
    </div>
  );
}

/* ── Team ──────────────────────────────────────────────────── */

export function TeamTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
      {team.map(p => (
        <div key={p.name} style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#f3e2d2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#b85618',
            }}>{p.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: '#a1927f' }}>{p.role}</div>
            </div>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.statusDot }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1, background: '#faf7f2', borderRadius: 9, padding: 9 }}>
              <div style={{ fontSize: 10.5, color: '#a1927f' }}>Jobs today</div>
              <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>{p.jobsToday}</div>
            </div>
            <div style={{ flex: 1, background: '#faf7f2', borderRadius: 9, padding: 9 }}>
              <div style={{ fontSize: 10.5, color: '#a1927f' }}>Hrs this wk</div>
              <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>{p.hoursWeek}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Review ────────────────────────────────────────────────── */

export function ReviewTab() {
  const { jobs, approveJob, rejectJob } = useApp();
  const reviewJobs = jobs.filter(j => j.status === 'submitted');

  if (reviewJobs.length === 0) {
    return (
      <div style={{ ...card, padding: 50, textAlign: 'center', color: '#a1927f' }}>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16, color: '#2a211b' }}>All caught up</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>No submissions waiting for review.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reviewJobs.map(job => (
        <div key={job.id} style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 16 }}>{job.client}</div>
              <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 2 }}>{job.address} · submitted by {job.employee}</div>
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={() => rejectJob(job.id)} style={{
                border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
                fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 16px', cursor: 'pointer',
              }}>Send back</button>
              <button onClick={() => approveJob(job.id)} style={{
                border: 'none', background: '#4f8a5b', color: '#fff',
                fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 18px', cursor: 'pointer',
              }}>Approve</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {job.items.map(item => (
              <div key={item.id}>
                <div style={{
                  height: 92, borderRadius: 10, border: '1px solid #e4d6c4',
                  backgroundImage: 'repeating-linear-gradient(135deg,#e9dccd 0 9px,#f3ebdf 9px 18px)',
                }} />
                <div style={{ fontSize: 11, color: '#8a7d70', marginTop: 5, lineHeight: 1.3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Hours ─────────────────────────────────────────────────── */

const hoursGrid = '1.4fr repeat(5,1fr) .9fr';

export function HoursTab() {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
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
  );
}

/* ── Clients ───────────────────────────────────────────────── */

export function ClientsTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
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

/* ── Schedule ──────────────────────────────────────────────── */

const scheduleGrid = '1.4fr repeat(5,1fr)';

export function ScheduleTab() {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
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
  );
}

/* ── Templates ─────────────────────────────────────────────── */

export function TemplatesTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
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

/* ── Reports ───────────────────────────────────────────────── */

export function ReportsTab() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
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
