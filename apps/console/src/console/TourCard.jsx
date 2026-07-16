import React, { useEffect } from 'react';
import { TOUR_STEPS } from './helpContent.js';

const franklin = "'Libre Franklin',sans-serif";

// Floating guided-tour card. It steers the console itself — each step
// navigates to the tab it describes, so the manager tours the real UI with
// their real data instead of screenshots. `step` is the current index;
// `onEnd` fires on Finish or Skip (the caller marks onboarding done).
export default function TourCard({ step, setStep, navigateTo, onEnd }) {
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  // Follow the script: whenever the step changes, show that tab.
  useEffect(() => {
    if (s) navigateTo(s.tab);
  }, [step]);

  if (!s) return null;

  const navBtn = {
    border: '1px solid #e0d3c2', background: '#fff', color: '#8a7d70',
    fontWeight: 700, fontSize: 12, borderRadius: 8, padding: '7px 13px', cursor: 'pointer',
  };

  return (
    <div style={{
      position: 'fixed', right: 18, bottom: 18, zIndex: 70,
      width: 340, maxWidth: 'calc(100vw - 36px)',
      background: '#3a2c20', color: '#f3ead9', borderRadius: 14,
      padding: '16px 18px', boxShadow: '0 12px 40px rgba(42,33,27,.35)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: '#d8a679', textTransform: 'uppercase' }}>
          Tour · {step + 1} / {TOUR_STEPS.length}
        </div>
        <button onClick={onEnd} style={{
          border: 'none', background: 'transparent', color: '#b6a48f',
          fontWeight: 700, fontSize: 11.5, cursor: 'pointer', padding: 0,
        }}>Skip tour</button>
      </div>
      <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 16.5, marginTop: 7, color: '#fff' }}>{s.title}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 6, color: '#e2d5c2' }}>{s.body}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {TOUR_STEPS.map((_, i) => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: i === step ? '#d96b2b' : i < step ? '#8a6a4d' : '#5a4736',
            }} />
          ))}
        </div>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ ...navBtn, background: 'transparent', color: '#e2d5c2', borderColor: '#5a4736' }}>Back</button>
        )}
        <button onClick={() => last ? onEnd() : setStep(step + 1)} style={{
          border: 'none', background: '#d96b2b', color: '#fff', fontWeight: 700,
          fontSize: 12, borderRadius: 8, padding: '7px 15px', cursor: 'pointer',
        }}>{last ? 'Finish' : 'Next'}</button>
      </div>
    </div>
  );
}
