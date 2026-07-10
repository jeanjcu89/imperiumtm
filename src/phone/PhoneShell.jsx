import React from 'react';
import { useApp } from '../state.jsx';

const franklin = "'Libre Franklin',sans-serif";

function TabItem({ label, active }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '4px 0', color: active ? '#d96b2b' : '#a1927f',
    }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: active ? '#d96b2b' : '#d8c5ad' }} />
      <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
    </div>
  );
}

// Shared phone chrome: header (date + heading + avatar), scrollable body, bottom tab bar.
export default function PhoneShell({ heading, tab, children, bodyStyle = {} }) {
  const { dateStr } = useApp();
  return (
    <div style={{
      height: '100%', paddingTop: 52, display: 'flex', flexDirection: 'column',
      background: '#faf7f2', fontFamily: 'system-ui,sans-serif', color: '#2a211b',
    }}>
      <div style={{
        padding: '12px 18px 14px', background: '#fff', borderBottom: '1px solid #ece5db',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#a1927f', fontWeight: 600 }}>{dateStr}</div>
          <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 19, lineHeight: 1.1, marginTop: 2 }}>{heading}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: '#f3e2d2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: '#b85618', fontSize: 14,
        }}>MS</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', ...bodyStyle }}>
        {children}
      </div>
      <div style={{ flex: 'none', display: 'flex', background: '#fff', borderTop: '1px solid #ece5db', padding: '8px 8px 6px' }}>
        <TabItem label="Jobs" active={tab === 'jobs'} />
        <TabItem label="Issues" active={tab === 'issues'} />
        <TabItem label="Chat" active={tab === 'chat'} />
      </div>
    </div>
  );
}
