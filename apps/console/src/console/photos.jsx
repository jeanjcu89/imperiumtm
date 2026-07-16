import React, { useEffect, useState } from 'react';
import { getPhotoUrl } from '@imperium/shared';
import { useAuth } from '../AuthContext.jsx';

const franklin = "'Libre Franklin',sans-serif";

export function usePhotoUrl(path) {
  const { client } = useAuth();
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!client || !path) return undefined;
    getPhotoUrl(client, path).then(({ data }) => { if (!cancelled && data) setUrl(data); });
    return () => { cancelled = true; };
  }, [client, path]);
  return url;
}

export const photoPlaceholder = {
  width: '100%', aspectRatio: '4 / 3', borderRadius: 10, border: '1px solid #e4d6c4',
  backgroundImage: 'repeating-linear-gradient(135deg,#e9dccd 0 9px,#f3ebdf 9px 18px)',
};

// Full-size photo overlay: image + caption card with the proof timestamp.
// `photo` = { path, title, sub, takenAt } (takenAt pre-formatted, may be '').
export function Lightbox({ photo, onClose }) {
  const url = usePhotoUrl(photo.path);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onMouseDown={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(30,23,18,.82)', zIndex: 80,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, cursor: 'zoom-out',
    }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 'min(940px, 96vw)', cursor: 'default' }}>
        {url
          ? <img src={url} alt={photo.title} style={{
              maxWidth: '100%', maxHeight: '72vh', borderRadius: '12px 12px 0 0',
              display: 'block', margin: '0 auto', background: '#000',
            }} />
          : <div style={{ width: 'min(640px, 90vw)', height: 320, borderRadius: '12px 12px 0 0', background: '#3a2c20' }} />}
        <div style={{
          background: '#fff', borderRadius: '0 0 12px 12px', padding: '13px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: franklin, fontWeight: 700, fontSize: 14.5, color: '#2a211b' }}>{photo.title}</div>
            {photo.sub && <div style={{ fontSize: 12, color: '#8a7d70', marginTop: 2 }}>{photo.sub}</div>}
          </div>
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: '#a1927f', textTransform: 'uppercase' }}>Taken</div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 15, color: '#b85618', fontVariantNumeric: 'tabular-nums' }}>
              {photo.takenAt || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Review-grid thumbnail: 4:3 (taller than a letterbox crop), click to open
// the lightbox with the full-size photo.
export function ItemPhoto({ path, onOpen }) {
  const url = usePhotoUrl(path);
  if (!url) return <div style={photoPlaceholder} />;
  return (
    <img src={url} alt="" onClick={(e) => { e.stopPropagation(); onOpen(e); }} style={{
      width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 10,
      border: '1px solid #e4d6c4', display: 'block', cursor: 'zoom-in',
    }} />
  );
}

// Compact issue thumbnail; click opens the lightbox.
export function IssuePhoto({ path, onOpen, size = 52 }) {
  const url = usePhotoUrl(path);
  return (
    <div onClick={url ? (e) => { e.stopPropagation(); onOpen(e); } : undefined} style={{
      flex: 'none', width: size, height: size, borderRadius: 9, overflow: 'hidden',
      border: '1px solid #e4d6c4', background: '#efe4d5',
      cursor: url ? 'zoom-in' : 'default',
    }}>
      {url ? <img src={url} alt="issue" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
    </div>
  );
}
