import React, { useState } from 'react';
import { useData } from '../DataContext.jsx';
import { TaskPills } from './suggestedTasks.jsx';

const franklin = "'Libre Franklin',sans-serif";

const inputStyle = {
  width: '100%', border: '1px solid #e0d3c2', borderRadius: 9,
  background: '#faf7f2', padding: '10px 12px', fontSize: 13.5,
  color: '#2a211b', outline: 'none',
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  );
}

// Add or edit a checklist template. Pass `template` (a mapped template) to
// edit; omit to add. Items are one label per line, like the New Job modal.
export default function TemplateModal({ template, onClose }) {
  const { addTemplate, updateTemplate } = useData();
  const editing = !!template;
  const [name, setName] = useState(template?.name ?? '');
  const [photoPolicy, setPhotoPolicy] = useState(template?.photoPolicy ?? '');
  const [itemsText, setItemsText] = useState((template?.items ?? []).map(i => i.label).join('\n'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const itemLabels = itemsText.split('\n').map(s => s.trim()).filter(Boolean);
  const canSubmit = name.trim().length > 0 && itemLabels.length > 0 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true); setError('');
    const params = { name: name.trim(), photoPolicy: photoPolicy.trim(), itemLabels };
    const { error: err } = editing
      ? await updateTemplate({ id: template.id, ...params })
      : await addTemplate(params);
    if (err) { setError(err.message); setSubmitting(false); return; }
    onClose();
  };

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(42,33,27,.45)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{
        width: 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        background: '#fff', border: '1px solid #ece5db', borderRadius: 14, padding: '22px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>
              {editing ? 'Edit template' : 'New checklist template'}
            </div>
            <div style={{ fontSize: 12, color: '#a1927f', marginTop: 2 }}>Reusable task list for a service type</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            border: 'none', background: 'transparent', color: '#a1927f',
            fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 4,
          }}>×</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Template name">
            <input style={inputStyle} type="text" value={name} autoFocus
              onChange={e => setName(e.target.value)} placeholder="Standard office" />
          </Field>
          <Field label="Photo policy">
            <input style={inputStyle} type="text" value={photoPolicy}
              onChange={e => setPhotoPolicy(e.target.value)} placeholder="Photo per item · Before / after" />
          </Field>
          <Field label="Tasks — one item per line">
            <textarea style={{ ...inputStyle, minHeight: 130, resize: 'vertical', lineHeight: 1.5 }}
              value={itemsText} onChange={e => setItemsText(e.target.value)}
              placeholder={'Wipe desks & surfaces\nRestrooms\nKitchen / breakroom\nVacuum common areas\nEmpty bins\nGlass & mirrors'} />
          </Field>
          <TaskPills text={itemsText} onChange={setItemsText} />

          {error && (
            <div style={{ fontSize: 12.5, color: '#b85618', lineHeight: 1.45, marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
              fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 16px', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={!canSubmit} style={{
              border: 'none', background: '#d96b2b', color: '#fff',
              fontWeight: 700, fontSize: 12.5, borderRadius: 9, padding: '9px 18px',
              cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.55,
            }}>{submitting ? 'Saving…' : editing ? 'Save changes' : 'Create template'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
