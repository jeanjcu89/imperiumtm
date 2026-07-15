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

// Add or edit a client. Pass `client` (a mapped client) to edit; omit to add.
export default function ClientModal({ client, onClose }) {
  const { addClient, updateClient } = useData();
  const editing = !!client;
  const [name, setName] = useState(client?.name ?? '');
  const [address, setAddress] = useState(client?.address ?? '');
  const [frequency, setFrequency] = useState(client?.frequency ?? '');
  const [notes, setNotes] = useState(client?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = name.trim().length > 0 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true); setError('');
    const params = { name: name.trim(), address: address.trim(), frequency: frequency.trim(), notes: notes.trim() };
    const { error: err } = editing
      ? await updateClient(client.id, params)
      : await addClient(params);
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
        width: 460, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        background: '#fff', border: '1px solid #ece5db', borderRadius: 14, padding: '22px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>
            {editing ? 'Edit client' : 'New client'}
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            border: 'none', background: 'transparent', color: '#a1927f',
            fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 4,
          }}>×</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Client name">
            <input style={inputStyle} type="text" value={name} autoFocus
              onChange={e => setName(e.target.value)} placeholder="Riverside Dental" />
          </Field>
          <Field label="Address / locations">
            <input style={inputStyle} type="text" value={address}
              onChange={e => setAddress(e.target.value)} placeholder="120 River St, Suite 5" />
          </Field>
          <Field label="Frequency">
            <input style={inputStyle} type="text" value={frequency}
              onChange={e => setFrequency(e.target.value)} placeholder="Daily · 3× / week · Weekly" />
          </Field>
          <Field label="Notes">
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Access details, keyholder, special instructions…" />
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
            }}>{submitting ? 'Saving…' : editing ? 'Save changes' : 'Add client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
