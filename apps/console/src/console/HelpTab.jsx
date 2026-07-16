import React, { useState } from 'react';
import useIsMobile from '../useIsMobile.js';
import { HELP_TOPICS } from './helpContent.js';

const franklin = "'Libre Franklin',sans-serif";
const card = { background: '#fff', border: '1px solid #ece5db', borderRadius: 14 };

export default function HelpTab({ startTour }) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set(['start']));

  const q = query.trim().toLowerCase();
  const topics = q
    ? HELP_TOPICS.filter(t =>
        t.title.toLowerCase().includes(q) || t.body.some(p => p.toLowerCase().includes(q)))
    : HELP_TOPICS;

  // While searching, matches are force-expanded — toggling then would only
  // mutate hidden state that surprises the user once the query is cleared.
  const toggle = (id) => {
    if (q) return;
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div style={{
        ...card, padding: isMobile ? 16 : '18px 20px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 16 }}>New here?</div>
          <div style={{ fontSize: 12.5, color: '#8a7d70', marginTop: 3, lineHeight: 1.5 }}>
            The guided tour walks you through the console tab by tab, on your real data.
          </div>
        </div>
        <button onClick={startTour} style={{
          border: 'none', background: '#d96b2b', color: '#fff', fontWeight: 700,
          fontSize: 12.5, borderRadius: 9, padding: '10px 18px', cursor: 'pointer', flex: 'none',
        }}>Take the tour</button>
      </div>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search help topics…"
        style={{
          width: '100%', boxSizing: 'border-box', border: '1px solid #e0d3c2', borderRadius: 10,
          background: '#fff', padding: '11px 14px', fontSize: 13.5, color: '#2a211b',
          outline: 'none', marginBottom: 14,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topics.map(t => {
          const isOpen = open.has(t.id) || !!q;   // searching expands matches
          return (
            <div key={t.id} style={card}>
              <button onClick={() => toggle(t.id)} style={{
                width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
                padding: '14px 18px', cursor: q ? 'default' : 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                <span style={{ fontFamily: franklin, fontWeight: 700, fontSize: 14.5, color: '#2a211b' }}>{t.title}</span>
                {!q && <span style={{ color: '#a1927f', fontSize: 13, fontWeight: 700 }}>{isOpen ? '−' : '+'}</span>}
              </button>
              {isOpen && (
                <div style={{ padding: '0 18px 15px' }}>
                  {t.body.map((p, i) => (
                    <p key={i} style={{ fontSize: 13, lineHeight: 1.6, color: '#5a4c40', margin: i === 0 ? 0 : '8px 0 0' }}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {topics.length === 0 && (
          <div style={{ ...card, padding: 30, textAlign: 'center', color: '#a1927f', fontSize: 13 }}>
            Nothing matches “{query}”. Try another word, or take the tour.
          </div>
        )}
      </div>
    </>
  );
}
