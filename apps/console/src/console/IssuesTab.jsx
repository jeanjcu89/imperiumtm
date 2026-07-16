import React, { useState } from 'react';
import { timeMeta } from '@imperium/shared';
import { useData } from '../DataContext.jsx';
import useIsMobile from '../useIsMobile.js';
import { IssuePhoto, Lightbox } from './photos.jsx';

const franklin = "'Libre Franklin',sans-serif";
const card = { background: '#fff', border: '1px solid #ece5db', borderRadius: 14 };

const chip = (label, bg, fg) => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
    background: bg, color: fg, textTransform: 'uppercase', letterSpacing: '.04em', flex: 'none',
  }}>{label}</span>
);

function IssueCard({ iss, onOpenPhoto }) {
  const { replyToIssue, setIssueResolved } = useData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // Optimistic copy of a reply we just sent, shown until the realtime refetch
  // delivers it back on iss.reply.
  const [justSent, setJustSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // What the card treats as the current reply. Deriving from iss.reply first
  // means a reply arriving via realtime (another manager, another tab) shows
  // up immediately instead of being hidden behind a stale compose box.
  const reply = iss.reply ?? justSent;
  const composing = editing || !reply;

  const sendReply = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true); setError('');
    const { error: err } = (await replyToIssue(iss.id, text)) ?? {};
    setBusy(false);
    if (err) { setError(`Could not send the reply — ${err.message}`); return; }
    setJustSent(text);
    setEditing(false);
    setDraft('');
  };

  const startEdit = () => { setDraft(reply ?? ''); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(''); };

  const toggleResolved = async () => {
    if (busy) return;
    setBusy(true); setError('');
    const { error: err } = (await setIssueResolved(iss.id, !iss.resolvedAt)) ?? {};
    setBusy(false);
    if (err) setError(`Could not update — ${err.message}`);
  };

  const resolved = !!iss.resolvedAt;

  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: franklin, fontWeight: 700, fontSize: 14 }}>{iss.author || 'Crew'}</span>
            {resolved
              ? chip('Resolved', '#e2efe5', '#4f8a5b')
              : chip('Open', '#f6e0d0', '#b85618')}
            <span style={{ fontSize: 11, color: '#a1927f', fontFamily: 'ui-monospace,monospace' }}>{iss.meta}</span>
          </div>
          {iss.text && <div style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 7 }}>{iss.text}</div>}
        </div>
        {iss.photoPath && (
          <IssuePhoto path={iss.photoPath} size={64} onOpen={() => onOpenPhoto(iss)} />
        )}
      </div>

      {/* reply */}
      <div style={{ marginTop: 13, borderTop: '1px solid #f4ede3', paddingTop: 12 }}>
        {!composing ? (
          <div style={{ background: '#faf7f2', borderLeft: '3px solid #d96b2b', borderRadius: '0 9px 9px 0', padding: '9px 12px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b85618', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Reply{iss.reply && iss.repliedAt ? ` · ${timeMeta(iss.repliedAt)}` : justSent ? ' · Just now' : ''}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>{reply}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Reply to the crew member — they'll see it in the field app…"
              style={{
                flex: 1, border: '1px solid #e0d3c2', borderRadius: 9, background: '#faf7f2',
                padding: '9px 11px', fontSize: 13, color: '#2a211b', outline: 'none',
                minHeight: 42, resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit',
              }} />
            <button onClick={sendReply} disabled={busy || !draft.trim()} style={{
              border: 'none', background: '#d96b2b', color: '#fff', fontWeight: 700,
              fontSize: 12.5, borderRadius: 9, padding: '10px 15px', flex: 'none',
              cursor: draft.trim() && !busy ? 'pointer' : 'default',
              opacity: draft.trim() && !busy ? 1 : 0.55,
            }}>{busy ? 'Sending…' : 'Reply'}</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          {!composing && (
            <button onClick={startEdit} style={{
              border: 'none', background: 'transparent', color: '#8a7d70',
              fontWeight: 700, fontSize: 11.5, cursor: 'pointer', padding: 0,
            }}>Edit reply</button>
          )}
          {editing && (
            <button onClick={cancelEdit} style={{
              border: 'none', background: 'transparent', color: '#8a7d70',
              fontWeight: 700, fontSize: 11.5, cursor: 'pointer', padding: 0,
            }}>Cancel</button>
          )}
          <button onClick={toggleResolved} disabled={busy} style={{
            border: 'none', background: 'transparent', color: resolved ? '#8a7d70' : '#4f8a5b',
            fontWeight: 700, fontSize: 11.5, cursor: 'pointer', padding: 0,
          }}>{resolved ? 'Reopen' : 'Mark resolved'}</button>
          {error && <span style={{ fontSize: 11.5, color: '#b85618', fontWeight: 600 }}>{error}</span>}
        </div>
      </div>
    </div>
  );
}

export default function IssuesTab() {
  const { issues } = useData();
  const isMobile = useIsMobile();
  const [lightbox, setLightbox] = useState(null);

  const open = issues.filter(i => !i.resolvedAt);
  const resolved = issues.filter(i => i.resolvedAt);

  const openPhoto = (iss) => setLightbox({
    path: iss.photoPath, title: iss.text || 'Issue photo', sub: iss.author, takenAt: iss.meta,
  });

  if (issues.length === 0) {
    return (
      <div style={{ ...card, padding: 50, textAlign: 'center', color: '#a1927f' }}>
        <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 16, color: '#2a211b' }}>No issues reported</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Crew reports from the field app land here for review and reply.</div>
      </div>
    );
  }

  const section = (title, list) => list.length > 0 && (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 14, color: '#2a211b', margin: '0 2px 10px' }}>
        {title} <span style={{ color: '#a1927f', fontWeight: 600 }}>· {list.length}</span>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: isMobile ? 10 : 14, alignItems: 'start',
      }}>
        {list.map(iss => <IssueCard key={iss.id} iss={iss} onOpenPhoto={openPhoto} />)}
      </div>
    </div>
  );

  return (
    <>
      {section('Open', open)}
      {section('Resolved', resolved)}
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}
