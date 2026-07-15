import React, { useMemo, useState } from 'react';
import { ymd, parseYmd, addDays, recurrenceDates } from '@imperium/shared';
import { useData } from '../DataContext.jsx';
import useIsMobile from '../useIsMobile.js';
import { TaskPills } from './suggestedTasks.jsx';

const franklin = "'Libre Franklin',sans-serif";

const inputStyle = {
  width: '100%', border: '1px solid #e0d3c2', borderRadius: 9,
  background: '#faf7f2', padding: '10px 12px', fontSize: 13.5,
  color: '#2a211b', outline: 'none',
};

// Monday-first so the pills read like a calendar; `day` is a JS getDay() value.
const WEEKDAYS = [
  { label: 'Mon', day: 1 }, { label: 'Tue', day: 2 }, { label: 'Wed', day: 3 },
  { label: 'Thu', day: 4 }, { label: 'Fri', day: 5 }, { label: 'Sat', day: 6 },
  { label: 'Sun', day: 0 },
];

const fmtShort = (s) => parseYmd(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  );
}

// `prefill` may carry { assigneeId, scheduledDate } (e.g. from a Schedule cell).
export default function NewJobModal({ onClose, prefill = {} }) {
  const { team, clients, templates, createJob } = useData();
  const isMobile = useIsMobile();
  const [clientSel, setClientSel] = useState('');   // '' = enter a new client
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [timeLabel, setTimeLabel] = useState('');
  const [estHours, setEstHours] = useState('');
  const [assigneeId, setAssigneeId] = useState(prefill.assigneeId ?? '');
  const [startDate, setStartDate] = useState(prefill.scheduledDate ?? ymd(new Date()));
  const [frequency, setFrequency] = useState('once');   // once | weekly | biweekly | monthly
  const [weekdays, setWeekdays] = useState(() => new Set());
  const [until, setUntil] = useState(ymd(addDays(new Date(), 56)));  // +8 weeks
  const [templateSel, setTemplateSel] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedClient = clients.find(c => c.id === clientSel);
  const usingExisting = !!selectedClient;
  const effClientName = usingExisting ? selectedClient.name : clientName.trim();
  const effAddress = usingExisting ? selectedClient.address : address.trim();
  const repeats = frequency !== 'once';
  const byWeekday = frequency === 'weekly' || frequency === 'biweekly';

  const applyTemplate = (id) => {
    setTemplateSel(id);
    const t = templates.find(x => x.id === id);
    if (t) setItemsText(t.items.map(i => i.label).join('\n'));
  };

  // Switching to a weekly cadence with nothing ticked yet: seed the weekday
  // from the start date so the common "same day each week" case is one click.
  const changeFrequency = (f) => {
    setFrequency(f);
    if ((f === 'weekly' || f === 'biweekly') && weekdays.size === 0) {
      const d = parseYmd(startDate);
      if (d) setWeekdays(new Set([d.getDay()]));
    }
  };

  const toggleWeekday = (day) => setWeekdays(prev => {
    const next = new Set(prev);
    if (next.has(day)) next.delete(day); else next.add(day);
    return next;
  });

  // Every scheduled day this job will occupy — one for a one-off, many for a
  // recurring series. Drives both validation and the "creates N jobs" summary.
  const dates = useMemo(() => {
    if (frequency === 'once') return startDate ? [startDate] : [];
    return recurrenceDates({
      start: parseYmd(startDate), until: parseYmd(until),
      frequency, weekdays: [...weekdays],
    });
  }, [frequency, startDate, until, weekdays]);
  const capped = dates.length >= 200;

  // A job needs a client, an assignee, at least one checklist item and at
  // least one scheduled day, else it can't appear in anyone's field app.
  const itemLabels = itemsText.split('\n').map(s => s.trim()).filter(Boolean);
  const canSubmit = effClientName.length > 0 && assigneeId
    && itemLabels.length > 0 && dates.length > 0 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true); setError('');
    const eh = Number(estHours);
    const { error: err } = await createJob({
      clientName: effClientName,
      clientId: usingExisting ? selectedClient.id : null,
      address: effAddress,
      timeLabel: timeLabel.trim(),
      estimatedHours: estHours.trim() && Number.isFinite(eh) ? eh : null,
      assigneeId: assigneeId || null,
      templateId: templateSel || null,
      itemLabels,
      dates,
    });
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
            <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 18 }}>New job</div>
            <div style={{ fontSize: 12, color: '#a1927f', marginTop: 2 }}>Assign a job with its checklist</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            border: 'none', background: 'transparent', color: '#a1927f',
            fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 4,
          }}>×</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Client">
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={clientSel} autoFocus
              onChange={e => setClientSel(e.target.value)}>
              <option value="">+ New client…</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          {usingExisting ? (
            selectedClient.address ? (
              <div style={{ fontSize: 12, color: '#8a7d70', margin: '-4px 0 12px' }}>{selectedClient.address}</div>
            ) : null
          ) : (
            <>
              <Field label="Client name">
                <input style={inputStyle} type="text" value={clientName}
                  onChange={e => setClientName(e.target.value)} placeholder="Riverside Dental" />
              </Field>
              <Field label="Address">
                <input style={inputStyle} type="text" value={address}
                  onChange={e => setAddress(e.target.value)} placeholder="120 River St, Suite 5" />
              </Field>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : 12 }}>
            <Field label={repeats ? 'Start date' : 'Date'}>
              <input style={inputStyle} type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)} />
            </Field>
            <Field label="Time">
              <input style={inputStyle} type="text" value={timeLabel}
                onChange={e => setTimeLabel(e.target.value)} placeholder="9:00 AM" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : 12 }}>
            <Field label="Estimated time (hours)">
              <input style={inputStyle} type="number" min="0" step="0.5" value={estHours}
                onChange={e => setEstHours(e.target.value)} placeholder="1.5" />
            </Field>
            <Field label="Repeat">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={frequency}
                onChange={e => changeFrequency(e.target.value)}>
                <option value="once">Does not repeat</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>
          </div>

          {byWeekday && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a7d70', marginBottom: 6 }}>On these days</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {WEEKDAYS.map(w => {
                  const active = weekdays.has(w.day);
                  return (
                    <button key={w.day} type="button" onClick={() => toggleWeekday(w.day)} style={{
                      border: active ? 'none' : '1px solid #e7d8c5',
                      background: active ? '#d96b2b' : '#fff',
                      color: active ? '#fff' : '#8a7d70',
                      fontWeight: 700, fontSize: 12, borderRadius: 8,
                      padding: '7px 0', width: 44, cursor: 'pointer', lineHeight: 1,
                    }}>{w.label}</button>
                  );
                })}
              </div>
            </div>
          )}

          {repeats && (
            <Field label="Repeat until">
              <input style={inputStyle} type="date" value={until} min={startDate}
                onChange={e => setUntil(e.target.value)} />
            </Field>
          )}

          {repeats && (
            <div style={{ fontSize: 12, marginTop: -2, marginBottom: 14, lineHeight: 1.45, color: dates.length ? '#8a7d70' : '#b85618' }}>
              {dates.length === 0
                ? (byWeekday ? 'Pick at least one weekday.' : 'Choose an end date on or after the start date.')
                : `Creates ${dates.length} job${dates.length === 1 ? '' : 's'} — ${fmtShort(dates[0])} to ${fmtShort(dates[dates.length - 1])}.${capped ? ' Capped at 200; shorten the date range for more control.' : ''}`}
            </div>
          )}

          <Field label="Assignee">
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}>
              <option value="">Choose a person…</option>
              {team.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.role === 'manager' ? ' (manager)' : ''}
                </option>
              ))}
            </select>
          </Field>

          {templates.length > 0 && (
            <Field label="Start from a template (optional)">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={templateSel}
                onChange={e => applyTemplate(e.target.value)}>
                <option value="">No template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} · {t.items.length} task{t.items.length === 1 ? '' : 's'}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Checklist — one item per line">
            <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.5 }}
              value={itemsText} onChange={e => setItemsText(e.target.value)}
              placeholder={'Wipe desks & surfaces\nRestrooms\nVacuum common areas\nEmpty bins'} />
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
            }}>{submitting ? 'Creating…' : dates.length > 1 ? `Create ${dates.length} jobs` : 'Create job'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
