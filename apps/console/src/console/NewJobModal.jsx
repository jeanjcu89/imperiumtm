import React, { useState } from 'react';
import { useData } from '../DataContext.jsx';

const franklin = "'Libre Franklin',sans-serif";

const inputStyle = {
  width: '100%', border: '1px solid #e0d3c2', borderRadius: 9,
  background: '#faf7f2', padding: '10px 12px', fontSize: 13.5,
  color: '#2a211b', outline: 'none',
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  );
}

export default function NewJobModal({ onClose }) {
  const { team, createJob } = useData();
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [timeLabel, setTimeLabel] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // A job needs an assignee and at least one checklist item, otherwise it
  // can never appear in anyone's field app or be completed.
  const itemLabels = itemsText.split('\n').map(s => s.trim()).filter(Boolean);
  const canSubmit = clientName.trim().length > 0 && assigneeId && itemLabels.length > 0 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true); setError('');
    const { error: err } = await createJob({
      clientName: clientName.trim(),
      address: address.trim(),
      timeLabel: timeLabel.trim(),
      assigneeId: assigneeId || null,
      itemLabels,
    });
    if (err) { setError(err.message); setSubmitting(false); return; }
    onClose();
  };

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(42,33,27,.45)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{
        width: 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        background: '#fff', border: '1px solid #ece5db', borderRadius: 14, padding: '22px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>New job</div>
            <div style={{ fontSize: 12, color: '#a1927f', marginTop: 2 }}>Assign a job with its checklist</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            border: 'none', background: 'transparent', color: '#a1927f',
            fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 4,
          }}>×</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Client name">
            <input style={inputStyle} type="text" value={clientName} autoFocus
              onChange={e => setClientName(e.target.value)} placeholder="Riverside Dental" />
          </Field>
          <Field label="Address">
            <input style={inputStyle} type="text" value={address}
              onChange={e => setAddress(e.target.value)} placeholder="120 River St, Suite 5" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
            <Field label="Time">
              <input style={inputStyle} type="text" value={timeLabel}
                onChange={e => setTimeLabel(e.target.value)} placeholder="9:00 AM" />
            </Field>
            <Field label="Assignee">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}>
                <option value="">Choose a person…</option>
                {team.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.role === 'manager' ? ' (manager)' : ''}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Checklist — one item per line">
            <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.5 }}
              value={itemsText} onChange={e => setItemsText(e.target.value)}
              placeholder={'Wipe desks & surfaces\nRestrooms\nVacuum common areas\nEmpty bins'} />
          </Field>

          {error && (
            <div style={{ fontSize: 12.5, color: '#b85618', lineHeight: 1.45, marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
              fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 16px', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={!canSubmit} style={{
              border: 'none', background: '#d96b2b', color: '#fff',
              fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 18px',
              cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.55,
            }}>{submitting ? 'Creating…' : 'Create job'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
