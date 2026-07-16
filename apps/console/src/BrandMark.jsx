import React from 'react';

// The Imperium mark — shield + check with signal bars (same artwork as
// assets/imperium-tm-mark.svg and the mobile app icon). `tile` wraps it in a
// cream rounded square so it reads on dark surfaces like the sidebar.
export default function BrandMark({ size = 34, tile = false, radius = 9 }) {
  const art = tile ? Math.round(size * 0.78) : size;
  const svg = (
    <svg viewBox="0 0 100 100" width={art} height={art} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <mask id="imperium-chk">
          <rect width="100" height="100" fill="#fff" />
          <path d="M38,58 L47,67 L64,48" fill="none" stroke="#000" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>
      <rect x="36" y="16" width="7" height="14" rx="3.5" fill="#d96b2b" />
      <rect x="46.5" y="8" width="7" height="22" rx="3.5" fill="#d96b2b" />
      <rect x="57" y="16" width="7" height="14" rx="3.5" fill="#d96b2b" />
      <path d="M50,34 L78,44 L78,62 Q78,80 50,90 Q22,80 22,62 L22,44 Z" fill="#3a2c20" mask="url(#imperium-chk)" />
    </svg>
  );
  if (!tile) return svg;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, background: '#f3ead9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
    }}>{svg}</div>
  );
}
