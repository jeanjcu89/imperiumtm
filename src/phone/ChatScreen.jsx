import React, { useEffect, useRef, useState } from 'react';
import PhoneShell from './PhoneShell.jsx';
import { useApp } from '../state.jsx';

export default function ChatScreen() {
  const { messages, sendMessage } = useApp();
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(t);
    setText('');
  };

  return (
    <PhoneShell heading="Messages" tab="chat" bodyStyle={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{
                background: m.mine ? '#d96b2b' : '#fff', color: m.mine ? '#fff' : '#2a211b',
                padding: '9px 12px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.4,
              }}>{m.text}</div>
              <div style={{
                fontSize: 10, color: '#a1927f', marginTop: 3,
                textAlign: m.mine ? 'right' : 'left', fontFamily: 'ui-monospace,monospace',
              }}>{m.who}</div>
            </div>
          ))}
        </div>
        <div style={{
          padding: '11px 14px', borderTop: '1px solid #ece5db', background: '#fff',
          display: 'flex', gap: 9, alignItems: 'center',
        }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Message dispatch…"
            style={{
              flex: 1, border: '1px solid #ece5db', borderRadius: 20, padding: '10px 14px',
              fontSize: 14, fontFamily: 'system-ui', background: '#faf7f2', color: '#2a211b',
            }}
          />
          <button onClick={send} style={{
            flex: 'none', width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: '#d96b2b', color: '#fff', fontSize: 17, cursor: 'pointer',
          }}>↑</button>
        </div>
      </div>
    </PhoneShell>
  );
}
