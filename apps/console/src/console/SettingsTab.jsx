import React, { useEffect, useState } from 'react';
import {
  fetchCompany, updateCompany, updateOwnName, changePassword,
} from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import useIsMobile from '../useIsMobile.js';

const franklin = "'Libre Franklin',sans-serif";
const card = { background: '#fff', border: '1px solid #ece5db', borderRadius: 14 };

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

function SaveButton({ busy, disabled, children = 'Save changes' }) {
  return (
    <button type="submit" disabled={disabled || busy} style={{
      border: 'none', background: '#d96b2b', color: '#fff', fontWeight: 700,
      fontSize: 12.5, borderRadius: 9, padding: '9px 18px',
      cursor: disabled || busy ? 'default' : 'pointer', opacity: disabled || busy ? 0.55 : 1,
    }}>{busy ? 'Saving…' : children}</button>
  );
}

// Section card with its own form, save state and feedback line.
function Section({ title, sub, onSubmit, busy, error, saved, canSave, children, saveLabel }) {
  return (
    <form onSubmit={onSubmit} style={{ ...card, padding: 18 }}>
      <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 15 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#a1927f', margin: '3px 0 0' }}>{sub}</div>}
      <div style={{ marginTop: 14 }}>{children}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <SaveButton busy={busy} disabled={!canSave}>{saveLabel}</SaveButton>
        {error && <span style={{ fontSize: 12, color: '#b85618', fontWeight: 600 }}>{error}</span>}
        {saved && !error && <span style={{ fontSize: 12, color: '#4f8a5b', fontWeight: 700 }}>Saved ✓</span>}
      </div>
    </form>
  );
}

function ProfileSection() {
  const { client, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile.fullName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const next = name.trim();
    if (!next || busy) return;
    setBusy(true); setError(''); setSaved(false);
    const { error: err } = (await updateOwnName(client, profile.id, next)) ?? {};
    if (!err) await refreshProfile();
    setBusy(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
  };

  return (
    <Section title="Your profile" sub="How your name appears to your team"
      onSubmit={submit} busy={busy} error={error} saved={saved}
      canSave={name.trim().length > 0 && name.trim() !== profile.fullName}>
      <Field label="Full name">
        <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field label="Email">
        <input style={{ ...inputStyle, color: '#a1927f', cursor: 'not-allowed' }} type="email" value={profile.email || ''} disabled />
      </Field>
      <div style={{ fontSize: 11.5, color: '#a1927f', marginTop: -6, marginBottom: 12 }}>
        Role: <span style={{ color: '#3a2c20', fontWeight: 600 }}>{profile.role === 'manager' ? 'Manager' : 'Crew'}</span>
      </div>
    </Section>
  );
}

function PasswordSection() {
  const { client } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const mismatch = pw2.length > 0 && pw !== pw2;
  const canSave = pw.length >= 8 && pw === pw2;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave || busy) return;
    setBusy(true); setError(''); setSaved(false);
    const { error: err } = (await changePassword(client, pw)) ?? {};
    setBusy(false);
    if (err) { setError(err.message); return; }
    setPw(''); setPw2(''); setSaved(true);
  };

  return (
    <Section title="Password" sub="At least 8 characters"
      onSubmit={submit} busy={busy} error={error || (mismatch ? 'Passwords don’t match.' : '')}
      saved={saved} canSave={canSave} saveLabel="Change password">
      <Field label="New password">
        <input style={inputStyle} type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password">
        <input style={inputStyle} type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" />
      </Field>
    </Section>
  );
}

function CompanySection() {
  const { client, profile, refreshProfile } = useAuth();
  const [loaded, setLoaded] = useState(null);  // fetched company or null
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCompany(client, profile.companyId).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err || !data) { setError(err?.message ?? 'Could not load the company.'); return; }
      setLoaded(data);
      setName(data.name); setAddress(data.address); setPhone(data.phone);
    });
    return () => { cancelled = true; };
  }, [client, profile.companyId]);

  const dirty = loaded && (
    name.trim() !== loaded.name || address.trim() !== loaded.address || phone.trim() !== loaded.phone);

  const submit = async (e) => {
    e.preventDefault();
    if (!dirty || !name.trim() || busy) return;
    setBusy(true); setError(''); setSaved(false);
    const next = { name: name.trim(), address: address.trim(), phone: phone.trim() };
    const { error: err } = (await updateCompany(client, profile.companyId, next)) ?? {};
    if (!err) await refreshProfile();   // sidebar shows the company name
    setBusy(false);
    if (err) { setError(err.message); return; }
    setLoaded({ ...loaded, ...next });
    setSaved(true);
  };

  return (
    <Section title="Company profile" sub="Shown across the console and on future documents"
      onSubmit={submit} busy={busy} error={error} saved={saved}
      canSave={!!dirty && name.trim().length > 0}>
      {!loaded && !error ? (
        <div style={{ fontSize: 12.5, color: '#a1927f', marginBottom: 12 }}>Loading…</div>
      ) : (
        <>
          <Field label="Company name">
            <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <Field label="Address">
            <input style={inputStyle} type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, city" />
          </Field>
          <Field label="Phone">
            <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" />
          </Field>
        </>
      )}
    </Section>
  );
}

export default function SettingsTab() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
      gap: isMobile ? 12 : 16, alignItems: 'start',
    }}>
      <ProfileSection />
      <PasswordSection />
      {profile.role === 'manager' && <CompanySection />}
    </div>
  );
}
