import React, { useState } from 'react';
import { signUpWithInvite } from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import BrandMark from '../BrandMark.jsx';

const franklin = "'Libre Franklin',sans-serif";

const inputStyle = {
  width: '100%', border: '1px solid #e0d3c2', borderRadius: 9,
  background: '#faf7f2', padding: '10px 12px', fontSize: 13.5,
  color: '#2a211b', outline: 'none',
};

function Field({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 5 }}>{label}</div>
      <input style={inputStyle} {...props} />
    </label>
  );
}

export default function AuthScreen() {
  const { client, signIn, signUpCompany } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const switchMode = (m) => {
    setMode(m); setError(''); setNotice('');
  };

  const canSubmit = email.trim() && password && (
    mode === 'signin'
    || (mode === 'create' && companyName.trim() && fullName.trim())
    || (mode === 'invite' && inviteCode.trim() && fullName.trim())
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true); setError(''); setNotice('');
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn({ email: email.trim(), password });
        if (err) setError(err.message);
        // On success the auth listener swaps this screen out.
      } else {
        const { data, error: err } = mode === 'create'
          ? await signUpCompany({
              email: email.trim(), password,
              fullName: fullName.trim(), companyName: companyName.trim(),
            })
          : await signUpWithInvite(client, {
              email: email.trim(), password,
              fullName: fullName.trim(), inviteCode: inviteCode.trim(),
            });
        if (err) {
          setError(err.message);
        } else if (data?.user && !data.session) {
          // Email confirmation is on: no session until the link is clicked.
          setNotice('Check your email to confirm your account, then sign in.');
          setMode('signin');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: 384, maxWidth: '100%', background: '#fff',
        border: '1px solid #ece5db', borderRadius: 14, padding: '30px 28px 26px',
      }}>
        {/* logo block */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          <BrandMark size={38} tile radius={10} />
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18, color: '#2a211b' }}>Imperium</div>
            <div style={{ fontSize: 11, color: '#a1927f' }}>Manager console</div>
          </div>
        </div>

        {/* mode tabs */}
        <div style={{ display: 'flex', gap: 3, background: '#efe9e0', borderRadius: 10, padding: 3, marginBottom: 18 }}>
          {[['signin', 'Sign in'], ['create', 'Create company'], ['invite', 'Invite code']].map(([key, label]) => {
            const on = mode === key;
            return (
              <button key={key} type="button" onClick={() => switchMode(key)} style={{
                flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, padding: '8px 0',
                fontSize: 12.5, fontWeight: on ? 700 : 600,
                background: on ? '#fff' : 'transparent', color: on ? '#2a211b' : '#8a7d70',
                boxShadow: on ? '0 1px 2px rgba(58,44,32,.08)' : 'none',
              }}>{label}</button>
            );
          })}
        </div>

        <form onSubmit={submit}>
          {mode === 'create' && (
            <Field label="Company name" type="text" value={companyName}
              onChange={e => setCompanyName(e.target.value)} placeholder="Sparkle Cleaning Co." autoComplete="organization" />
          )}
          {mode === 'invite' && (
            <Field label="Invite code" type="text" value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="ABC123"
              autoComplete="off" style={{ ...inputStyle, fontFamily: 'ui-monospace,monospace', letterSpacing: '.1em' }} />
          )}
          {mode !== 'signin' && (
            <Field label="Your name" type="text" value={fullName}
              onChange={e => setFullName(e.target.value)} placeholder="Dana Lowe" autoComplete="name" />
          )}
          <Field label="Email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
          <Field label="Password" type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />

          {error && (
            <div style={{ fontSize: 12.5, color: '#b85618', lineHeight: 1.45, marginBottom: 12 }}>{error}</div>
          )}
          {notice && (
            <div style={{
              fontSize: 12.5, color: '#4f8a5b', lineHeight: 1.45, marginBottom: 12,
              background: '#e2efe5', borderRadius: 9, padding: '9px 12px',
            }}>{notice}</div>
          )}

          <button type="submit" disabled={!canSubmit || submitting} style={{
            width: '100%', border: 'none', borderRadius: 9, padding: '11px 0',
            background: '#d96b2b', color: '#fff', fontWeight: 700, fontSize: 13.5,
            cursor: (!canSubmit || submitting) ? 'default' : 'pointer',
            opacity: (!canSubmit || submitting) ? 0.55 : 1,
          }}>
            {submitting
              ? (mode === 'signin' ? 'Signing in…' : mode === 'create' ? 'Creating company…' : 'Joining…')
              : (mode === 'signin' ? 'Sign in' : mode === 'create' ? 'Create company' : 'Join company')}
          </button>
        </form>

        <div style={{ fontSize: 11.5, color: '#a1927f', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          Crew members: enter your invite code in the Imperium field app instead.
        </div>
      </div>
    </div>
  );
}
