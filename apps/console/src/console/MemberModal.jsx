import React, { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useData } from '../DataContext.jsx';

const franklin = "'Libre Franklin',sans-serif";

const inputStyle = {
  width: '100%', border: '1px solid #e0d3c2', borderRadius: 9,
  background: '#faf7f2', padding: '10px 12px', fontSize: 13.5,
  color: '#2a211b', outline: 'none', boxSizing: 'border-box',
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  );
}

// Manager edits a team member: rename, change role, (de)activate. Editing
// yourself is limited to the name — demoting or deactivating your own account
// would lock you out of this very screen.
export default function MemberModal({ member, onClose }) {
  const { profile, refreshProfile } = useAuth();
  const { updateMember } = useData();
  const self = member.id === profile.id;
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [active, setActive] = useState(member.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSave = name.trim().length > 0 && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true); setError('');
    const patch = self
      ? { fullName: name.trim() }
      : { fullName: name.trim(), role, active };
    const { error: err } = (await updateMember(member.id, patch)) ?? {};
    setBusy(false);
    if (err) { setError(err.message); return; }
    // Renaming yourself must also update AuthContext (sidebar name/initials,
    // Settings form) — the realtime event only refreshes the team list.
    if (self) refreshProfile();
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
        width: 420, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        background: '#fff', border: '1px solid #ece5db', borderRadius: 14, padding: '22px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>Edit member</div>
            <div style={{ fontSize: 12, color: '#a1927f', marginTop: 2 }}>
              {self ? 'This is you — role and status are managed by another manager.' : member.name}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            border: 'none', background: 'transparent', color: '#a1927f',
            fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 4,
          }}>×</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Full name">
            <input style={inputStyle} type="text" value={name} autoFocus
              onChange={e => setName(e.target.value)} />
          </Field>
          {!self && (
            <>
              <Field label="Role">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={role}
                  onChange={e => setRole(e.target.value)}>
                  <option value="crew">Crew</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#d96b2b' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#3a2c20' }}>Active</span>
                <span style={{ fontSize: 11.5, color: '#a1927f' }}>— inactive members keep their history but can’t work jobs</span>
              </label>
            </>
          )}

          {error && (
            <div style={{ fontSize: 12.5, color: '#b85618', lineHeight: 1.45, marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
              fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 16px', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={!canSave} style={{
              border: 'none', background: '#d96b2b', color: '#fff',
              fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 18px',
              cursor: canSave ? 'pointer' : 'default', opacity: canSave ? 1 : 0.55,
            }}>{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
