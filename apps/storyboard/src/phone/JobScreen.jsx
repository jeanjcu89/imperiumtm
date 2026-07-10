import React from 'react';
import PhoneShell from './PhoneShell.jsx';
import { useApp, statusMeta, prog } from '../state.jsx';

const franklin = "'Libre Franklin',sans-serif";

function ChecklistItem({ item, jobId }) {
  const { toggleItem, capturePhoto } = useApp();
  return (
    <div style={{
      background: '#fff', border: `1px solid ${item.done ? '#f0e7dc' : '#ece5db'}`,
      borderRadius: 13, padding: '12px 13px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <button onClick={() => toggleItem(jobId, item.id)} style={{
          flex: 'none', width: 26, height: 26, borderRadius: 8,
          border: `2px solid ${item.done ? '#d96b2b' : '#d8c5ad'}`,
          background: item.done ? '#d96b2b' : '#fff',
          color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
        }}>{item.done ? '✓' : ''}</button>
        <div style={{
          flex: 1, fontSize: 14, fontWeight: 600,
          color: item.done ? '#a1927f' : '#2a211b',
          textDecoration: item.done ? 'line-through' : 'none',
        }}>{item.label}</div>
      </div>
      <div style={{ marginTop: 11, marginLeft: 37 }}>
        {item.photo ? (
          <div style={{
            position: 'relative', borderRadius: 10, overflow: 'hidden', height: 96,
            backgroundImage: 'repeating-linear-gradient(135deg,#e9dccd 0 9px,#f3ebdf 9px 18px)',
            border: '1px solid #e4d6c4', display: 'flex', alignItems: 'flex-end',
          }}>
            <div style={{
              width: '100%', padding: '6px 9px',
              background: 'linear-gradient(transparent,rgba(58,44,32,.55))',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 10, fontFamily: 'ui-monospace,monospace' }}>photo · just now</span>
              <button onClick={() => capturePhoto(jobId, item.id)} style={{
                border: 'none', background: 'rgba(255,255,255,.9)', borderRadius: 6,
                fontSize: 10, fontWeight: 700, padding: '3px 7px', cursor: 'pointer', color: '#3a2c20',
              }}>Retake</button>
            </div>
          </div>
        ) : (
          <button onClick={() => capturePhoto(jobId, item.id)} style={{
            width: '100%', border: '1.5px dashed #d8c5ad', background: '#fdfbf7', borderRadius: 10,
            padding: 12, cursor: 'pointer', color: '#b85618', fontSize: 12.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ width: 16, height: 13, border: '1.5px solid #b85618', borderRadius: 3, position: 'relative', display: 'inline-block' }} />
            Add photo
          </button>
        )}
      </div>
    </div>
  );
}

export default function JobScreen() {
  const { jobs, activeId, submitJob } = useApp();
  const job = jobs.find(j => j.id === activeId);
  if (!job) return <PhoneShell heading="Current job" tab="jobs" />;

  const p = prog(job);
  const m = statusMeta(job.status);
  const allDone = job.items.every(i => i.done);
  const submitted = job.status === 'submitted' || job.status === 'approved';

  return (
    <PhoneShell heading="Current job" tab="jobs">
      <div style={{ padding: '14px 16px 26px' }}>

        <div style={{ background: '#fff', border: '1px solid #ece5db', borderRadius: 14, padding: 15, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18, lineHeight: 1.15 }}>{job.client}</div>
              <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 4 }}>{job.address} · {job.time}</div>
            </div>
            <div style={{
              flex: 'none', fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
              background: m.bg, color: m.fg, textTransform: 'uppercase',
            }}>{m.label}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13 }}>
            <div style={{ flex: 1, height: 7, background: '#f0e7dc', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: p.pct, background: '#d96b2b', borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 12, color: '#a1927f', fontWeight: 700 }}>{p.text}</div>
          </div>
        </div>

        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 14, margin: '4px 2px 10px' }}>Checklist · photo proof per item</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {job.items.map(item => <ChecklistItem key={item.id} item={item} jobId={job.id} />)}
        </div>

        <button
          onClick={() => submitJob(job.id)}
          disabled={submitted || !allDone}
          style={{
            marginTop: 18, width: '100%', border: 'none', borderRadius: 12, padding: 15,
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            background: submitted ? '#e2efe5' : (allDone ? '#4f8a5b' : '#e6ded3'),
            color: submitted ? '#4f8a5b' : (allDone ? '#fff' : '#b6a48f'),
          }}
        >
          {submitted ? 'Submitted for review' : (allDone ? 'Submit completed job' : 'Complete all items to submit')}
        </button>
      </div>
    </PhoneShell>
  );
}
