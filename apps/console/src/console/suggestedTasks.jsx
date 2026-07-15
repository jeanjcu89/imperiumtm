import React from 'react';

// Common cleaning tasks offered as one-tap pills under a checklist textarea
// (New Job modal and template modal). Generic enough to suit most service
// types; managers can still type their own.
export const SUGGESTED_TASKS = [
  'Wipe desks & surfaces',
  'Sweep / mop floors',
  'Vacuum common areas',
  'Empty bins & recycling',
  'Clean restrooms',
  'Kitchen / breakroom',
  'Glass & mirrors',
  'Dust surfaces',
  'Sanitize high-touch points',
  'Restock supplies',
];

// Toggle a task in a newline-separated checklist: add it as a new line if
// absent, otherwise remove its line. Case-insensitive so a suggestion the
// manager already typed can't be duplicated.
export function toggleTaskLine(text, label) {
  const lines = text.split('\n');
  const idx = lines.findIndex(l => l.trim().toLowerCase() === label.toLowerCase());
  if (idx !== -1) return lines.filter((_, i) => i !== idx).join('\n');
  const base = text.replace(/\s+$/, '');
  return base ? `${base}\n${label}` : label;
}

// A row of tap-to-toggle suggestion pills sitting under a checklist textarea.
// `text` is the textarea's current value; `onChange` receives the next value.
export function TaskPills({ text, onChange }) {
  const present = new Set(
    text.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean));
  return (
    <div style={{ marginTop: -4, marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#a1927f', fontWeight: 600, marginBottom: 7 }}>Suggested — tap to add</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {SUGGESTED_TASKS.map(label => {
          const active = present.has(label.toLowerCase());
          return (
            <button key={label} type="button" onClick={() => onChange(toggleTaskLine(text, label))} style={{
              border: active ? 'none' : '1px solid #e7d8c5',
              background: active ? '#d96b2b' : '#fff',
              color: active ? '#fff' : '#8a7d70',
              fontWeight: 600, fontSize: 11.5, borderRadius: 20,
              padding: '5px 11px', cursor: 'pointer', lineHeight: 1.2,
            }}>{active ? '✓' : '+'} {label}</button>
          );
        })}
      </div>
    </div>
  );
}
