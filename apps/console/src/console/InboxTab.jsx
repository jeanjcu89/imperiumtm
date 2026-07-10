import React, { useEffect, useRef, useState } from 'react';
import { fetchMessages, sendMessage, clockLabel } from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';
import { useData } from '../DataContext.jsx';
import useIsMobile from '../useIsMobile.js';

const franklin = "'Libre Franklin',sans-serif";
const card = { background: '#fff', border: '1px solid #ece5db', borderRadius: 14 };

// One chat thread per crew member; managers read and reply to all of them.
export default function InboxTab() {
  const { client, profile } = useAuth();
  const { team, messagesVersion } = useData();
  const crew = team.filter(p => p.role === 'crew' && p.active);

  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef(null);

  const threadId = selectedId ?? crew[0]?.id ?? null;
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!client || !threadId) return;
    let cancelled = false;
    fetchMessages(client, threadId).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message);
      else if (data) setMessages(data);
    });
    return () => { cancelled = true; };
  }, [client, threadId, messagesVersion]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, threadId]);

  const send = async () => {
    const body = text.trim();
    if (!body || !threadId) return;
    setText('');
    setError('');
    setMessages(list => [...list, {
      id: `tmp-${Date.now()}`, text: body, senderId: profile.id,
      senderName: profile.fullName, senderRole: 'manager', createdAt: new Date().toISOString(),
    }]);
    const { error: err } = await sendMessage(client, {
      companyId: profile.companyId, threadId, senderId: profile.id, body,
    });
    if (err) {
      setMessages(list => list.filter(m => !String(m.id).startsWith('tmp-')));
      setError(`Message not sent — ${err.message}`);
      setText(body);
    }
  };

  if (crew.length === 0) {
    return (
      <div style={{ ...card, padding: 50, textAlign: 'center', color: '#a1927f' }}>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16, color: '#2a211b' }}>No crew yet</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Invite crew from the Team tab — each crew member gets a chat thread here.</div>
      </div>
    );
  }

  // Phone: crew picker becomes a horizontal chip row above the thread.
  const threadList = isMobile ? (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {crew.map(p => {
        const on = p.id === threadId;
        return (
          <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, flex: 'none',
            border: on ? 'none' : '1px solid #ece5db', cursor: 'pointer',
            borderRadius: 20, padding: '7px 13px 7px 8px',
            background: on ? '#f6e0d0' : '#fff',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: '#f3e2d2', flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#b85618',
            }}>{p.initials}</div>
            <span style={{ fontSize: 12.5, fontWeight: on ? 700 : 500, color: on ? '#b85618' : '#2a211b', whiteSpace: 'nowrap' }}>{p.name}</span>
          </button>
        );
      })}
    </div>
  ) : (
    <div style={{ ...card, padding: 10, alignSelf: 'start' }}>
      {crew.map(p => {
        const on = p.id === threadId;
        return (
          <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
            border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 10px',
            background: on ? '#f6e0d0' : 'transparent',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: '#f3e2d2', flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#b85618',
            }}>{p.initials}</div>
            <div style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? '#b85618' : '#2a211b' }}>{p.name}</div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr',
      gridTemplateRows: isMobile ? 'auto 1fr' : undefined,
      gap: isMobile ? 10 : 16, height: '100%', minHeight: isMobile ? 420 : 480,
    }}>
      {threadList}

      {/* thread */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 380 : 480 }}>
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ fontSize: 12.5, color: '#a1927f' }}>No messages in this thread yet.</div>
          )}
          {messages.map(m => {
            const mine = m.senderId === profile.id;
            return (
              <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                <div style={{
                  background: mine ? '#d96b2b' : '#faf7f2', color: mine ? '#fff' : '#2a211b',
                  border: mine ? 'none' : '1px solid #ece5db',
                  padding: '9px 12px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.4,
                }}>{m.text}</div>
                <div style={{
                  fontSize: 10, color: '#a1927f', marginTop: 3,
                  textAlign: mine ? 'right' : 'left', fontFamily: 'ui-monospace,monospace',
                }}>{m.senderName} · {clockLabel(m.createdAt)}</div>
              </div>
            );
          })}
        </div>
        {error && (
          <div style={{ padding: '8px 16px', color: '#b85618', fontSize: 12.5, fontWeight: 600 }}>{error}</div>
        )}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #ece5db', display: 'flex', gap: 9 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Reply…"
            style={{
              flex: 1, border: '1px solid #ece5db', borderRadius: 20, padding: '10px 14px',
              fontSize: 14, background: '#faf7f2', color: '#2a211b',
            }}
          />
          <button onClick={send} style={{
            flex: 'none', border: 'none', background: '#d96b2b', color: '#fff',
            fontWeight: 700, fontSize: 12.5, borderRadius: 20, padding: '10px 18px', cursor: 'pointer',
          }}>Send</button>
        </div>
      </div>
    </div>
  );
}
