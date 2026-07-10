import React, { useState } from 'react';
import PhoneShell from './PhoneShell.jsx';
import { useApp } from '../state.jsx';

const franklin = "'Libre Franklin',sans-serif";

export default function IssuesScreen() {
  const { issues, addIssue } = useApp();
  const [text, setText] = useState('');

  const send = () => {
    const t = text.trim();
    if (!t) return;
    addIssue(t);
    setText('');
  };

  return (
    <PhoneShell heading="Issues" tab="issues">
      <div style={{ padding: '16px 16px 26px' }}>
        <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 19, marginBottom: 4 }}>Report an issue</div>
        <div style={{ fontSize: 12, color: '#8a7d70', marginBottom: 14 }}>Flag anything blocking the job — missing supplies, access problems, damage.</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Describe the issue…"
          style={{
            width: '100%', height: 96, border: '1px solid #ece5db', borderRadius: 12, padding: 12,
            fontSize: 14, fontFamily: 'system-ui', resize: 'none', background: '#fff', color: '#2a211b',
          }}
        />
        <button onClick={send} style={{
          marginTop: 10, width: '100%', border: 'none', borderRadius: 11, padding: 13,
          fontWeight: 700, fontSize: 14, cursor: 'pointer', background: '#d96b2b', color: '#fff',
        }}>Send to manager</button>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 14, margin: '20px 2px 10px' }}>Recent</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {issues.map((iss, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #ece5db', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 13, color: '#2a211b', lineHeight: 1.4 }}>{iss.text}</div>
              <div style={{ fontSize: 10.5, color: '#a1927f', marginTop: 6, fontFamily: 'ui-monospace,monospace' }}>{iss.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}
