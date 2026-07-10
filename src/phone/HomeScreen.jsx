import React from 'react';
import PhoneShell from './PhoneShell.jsx';
import { useApp, statusMeta, prog, ME } from '../state.jsx';

const franklin = "'Libre Franklin',sans-serif";

export default function HomeScreen() {
  const { clock, toggleClock, jobs, openJob } = useApp();
  const myJobs = jobs.filter(j => j.employee === ME);

  return (
    <PhoneShell heading="Good morning, Maria" tab="jobs">
      <div style={{ padding: '16px 16px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* clock card */}
        <div style={{
          borderRadius: 16, padding: '16px 16px 15px', background: clock.bg, color: clock.fg,
          boxShadow: '0 6px 18px rgba(58,44,32,.10)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', opacity: .75, fontWeight: 600 }}>{clock.status}</div>
              <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 32, letterSpacing: '-.02em', marginTop: 3 }}>{clock.timeStr}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, opacity: .8, lineHeight: 1.5 }}>
              Today<br /><span style={{ fontSize: 15, fontWeight: 700 }}>{clock.hoursToday}</span>
            </div>
          </div>
          <button onClick={toggleClock} style={{
            marginTop: 14, width: '100%', border: 'none', borderRadius: 11, padding: 13,
            fontSize: 15, fontWeight: 700, cursor: 'pointer', background: clock.btnBg, color: clock.btnFg,
          }}>{clock.btnLabel}</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16 }}>Today's jobs</div>
          <div style={{ fontSize: 12, color: '#a1927f', fontWeight: 600 }}>{myJobs.length} assigned</div>
        </div>

        {myJobs.map(job => {
          const p = prog(job);
          const m = statusMeta(job.status);
          return (
            <div key={job.id} onClick={() => openJob(job.id)} style={{
              background: '#fff', border: '1px solid #ece5db', borderRadius: 14, padding: 14,
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(58,44,32,.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{job.client}</div>
                  <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 3 }}>{job.address}</div>
                </div>
                <div style={{
                  flex: 'none', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 20,
                  background: m.bg, color: m.fg, textTransform: 'uppercase', letterSpacing: '.04em',
                }}>{m.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#3a2c20' }}>{job.time}</div>
                <div style={{ flex: 1, height: 6, background: '#f0e7dc', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: p.pct, background: '#d96b2b', borderRadius: 6 }} />
                </div>
                <div style={{ fontSize: 11, color: '#a1927f', fontWeight: 600 }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </PhoneShell>
  );
}
