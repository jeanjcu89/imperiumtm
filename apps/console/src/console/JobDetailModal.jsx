import React, { useState } from 'react';
import { statusMeta, prog, timeMeta, photoTimestamp, parseYmd } from '@imperium/shared';
import useIsMobile from '../useIsMobile.js';
import { IssuePhoto, Lightbox } from './photos.jsx';

const franklin = "'Libre Franklin',sans-serif";

// Read-only job detail: status, schedule info, and exactly what the crew
// member has completed so far (per-item done state, photo + proof timestamp).
// `job` may be undefined (deleted while the hash pointed at it).
export default function JobDetailModal({ job, onClose }) {
  const isMobile = useIsMobile();
  const [lightbox, setLightbox] = useState(null);

  const m = job ? statusMeta(job.status) : null;
  const p = job ? prog(job) : null;
  const doneCount = job ? job.items.filter(i => i.done).length : 0;
  const dateLabel = job?.scheduledDate
    ? parseYmd(job.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Unscheduled';

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(42,33,27,.45)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{
        width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        background: '#fff', border: '1px solid #ece5db', borderRadius: 14, padding: '22px 24px',
      }}>
        {!job ? (
          <>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>Job not found</div>
            <div style={{ fontSize: 13, color: '#8a7d70', marginTop: 6 }}>This job no longer exists — it may have been deleted.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={onClose} style={{
                border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
                fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 16px', cursor: 'pointer',
              }}>Close</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>{job.client}</div>
                <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 3 }}>{job.address}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
                  background: m.bg, color: m.fg, textTransform: 'uppercase',
                }}>{m.label}</span>
                <button onClick={onClose} aria-label="Close" style={{
                  border: 'none', background: 'transparent', color: '#a1927f',
                  fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 4,
                }}>×</button>
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 10, marginTop: 15, background: '#faf7f2', border: '1px solid #f0e7dc',
              borderRadius: 11, padding: '11px 13px', fontSize: 12,
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Assigned</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{job.employee}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Date</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{dateLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Time</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{job.time || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a1927f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Estimate</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{job.estimatedHours ? `${job.estimatedHours} h` : '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 15 }}>
              <div style={{ flex: 1, height: 7, background: '#f0e7dc', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: p.pct, background: '#d96b2b' }} />
              </div>
              <span style={{ fontSize: 12, color: '#a1927f', fontWeight: 700 }}>{doneCount}/{job.items.length} done</span>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {job.items.map(item => {
                const taken = item.photoPath ? photoTimestamp(item.photoPath) : null;
                const takenLabel = taken ? timeMeta(taken) : '';
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    border: '1px solid #f0e7dc', borderRadius: 11, padding: '9px 12px',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7, flex: 'none',
                      border: item.done ? 'none' : '2px solid #d8c5ad',
                      background: item.done ? '#d96b2b' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 800,
                    }}>{item.done ? '✓' : ''}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: item.done ? '#a1927f' : '#2a211b',
                        textDecoration: item.done ? 'line-through' : 'none',
                      }}>{item.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 1, color: takenLabel ? '#b85618' : '#c9b8a3', fontVariantNumeric: 'tabular-nums' }}>
                        {takenLabel || (item.done ? 'No photo' : 'Not started')}
                      </div>
                    </div>
                    {item.photoPath && (
                      <IssuePhoto path={item.photoPath} size={46} onOpen={() => setLightbox({
                        path: item.photoPath, title: item.label,
                        sub: `${job.client} · ${job.employee}`, takenAt: takenLabel,
                      })} />
                    )}
                  </div>
                );
              })}
              {job.items.length === 0 && (
                <div style={{ fontSize: 12.5, color: '#a1927f', padding: '6px 2px' }}>This job has no checklist items.</div>
              )}
            </div>
          </>
        )}
      </div>
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
