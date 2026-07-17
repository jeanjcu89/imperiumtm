import React, { useState } from 'react';
import { changePassword } from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import BrandMark from '../BrandMark.jsx';

const franklin = "'Libre Franklin',sans-serif";

const inputStyle = {
  width: '100%', border: '1px solid #e0d3c2', borderRadius: 9,
  background: '#faf7f2', padding: '10px 12px', fontSize: 13.5,
  color: '#2a211b', outline: 'none', boxSizing: 'border-box',
};

// Shown when a password-recovery link signs the user in (any role — crew
// reset their password here too, then go back to the field app).
export default function RecoveryScreen() {
  const { client, clearRecovery, signOut } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mismatch = pw2.length > 0 && pw !== pw2;
  const canSave = pw.length >= 8 && pw === pw2 && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true); setError('');
    const { error: err } = (await changePassword(client, pw)) ?? {};
    setBusy(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        width: 384, maxWidth: '100%', background: '#fff',
        border: '1px solid #ece5db', borderRadius: 14, padding: '30px 28px 26px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <BrandMark size={38} tile radius={10} />
          <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18, color: '#2a211b' }}>Imperium</div>
        </div>

        {done ? (
          <>
            <div style={{
              fontSize: 13, color: '#4f8a5b', background: '#e2efe5', borderRadius: 9,
              padding: '10px 12px', lineHeight: 1.5, marginBottom: 16,
            }}>
              Password updated. Use it from now on — in this console or the field app.
            </div>
            <button onClick={clearRecovery} style={{
              width: '100%', border: 'none', borderRadius: 9, padding: '11px 0',
              background: '#d96b2b', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
            }}>Continue</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Set a new password</div>
            <div style={{ fontSize: 12.5, color: '#8a7d70', marginBottom: 16 }}>At least 8 characters.</div>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 5 }}>New password</div>
              <input style={inputStyle} type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" autoFocus />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 5 }}>Confirm new password</div>
              <input style={inputStyle} type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" />
            </label>
            {(error || mismatch) && (
              <div style={{ fontSize: 12.5, color: '#b85618', marginBottom: 12 }}>
                {error || 'Passwords don’t match.'}
              </div>
            )}
            <button type="submit" disabled={!canSave} style={{
              width: '100%', border: 'none', borderRadius: 9, padding: '11px 0',
              background: '#d96b2b', color: '#fff', fontWeight: 700, fontSize: 13.5,
              cursor: canSave ? 'pointer' : 'default', opacity: canSave ? 1 : 0.55,
            }}>{busy ? 'Saving…' : 'Save new password'}</button>
            <button type="button" onClick={signOut} style={{
              width: '100%', marginTop: 10, border: '1px solid #e0d3c2', background: '#fff',
              color: '#8a7d70', fontWeight: 700, fontSize: 12.5, borderRadius: 9,
              padding: '9px 0', cursor: 'pointer',
            }}>Cancel &amp; sign out</button>
          </form>
        )}
      </div>
    </div>
  );
}
