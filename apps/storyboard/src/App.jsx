import React from 'react';
import { AppProvider } from './state.jsx';
import IOSDevice from './frames/IOSDevice.jsx';
import ManagerConsole from './console/ManagerConsole.jsx';
import HomeScreen from './phone/HomeScreen.jsx';
import JobScreen from './phone/JobScreen.jsx';
import IssuesScreen from './phone/IssuesScreen.jsx';
import ChatScreen from './phone/ChatScreen.jsx';

const franklin = "'Libre Franklin',sans-serif";
const mono = 'ui-monospace,Menlo,monospace';

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </div>
  );
}

function PageHeader() {
  return (
    <div style={{
      width: '100%', maxWidth: 1580, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: '#d96b2b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: franklin, fontWeight: 800, fontSize: 18, lineHeight: 1,
          }}>I</div>
          <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 23, letterSpacing: '-.01em' }}>
            Imperium <span style={{ color: '#a1927f', fontWeight: 600 }}>Task Manager</span>
          </div>
        </div>
        <div style={{ marginTop: 7, fontSize: 13, color: '#8a7d70', maxWidth: 640, lineHeight: 1.5 }}>
          Field crew app + management backend for cleaning &amp; checklist operations.
          Everything is live — clock in, tick the checklist and attach photos on the phone,
          then watch it flow into the manager console.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#8a7d70', fontFamily: mono }}>
        <LegendDot color="#c9922b" label="Awaiting review" />
        <LegendDot color="#4f8a5b" label="Approved" />
        <LegendDot color="#d96b2b" label="In progress" />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontFamily: mono, color: '#a1927f',
      textTransform: 'uppercase', letterSpacing: '.14em',
    }}>{children}</div>
  );
}

function PhoneColumn({ caption, children }) {
  return (
    <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 11, fontFamily: 'ui-monospace,monospace', color: '#b6a48f', fontWeight: 600 }}>{caption}</div>
      <IOSDevice>{children}</IOSDevice>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div style={{
        minHeight: '100vh', padding: '34px 30px 60px',
        display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center',
      }}>
        <PageHeader />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 44, alignItems: 'center', width: '100%' }}>

          {/* employee mobile app */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <SectionLabel>Employee app · iOS / Android — every screen, live &amp; in sync</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, justifyContent: 'center', alignItems: 'flex-start' }}>
              <PhoneColumn caption="1 · Home & schedule"><HomeScreen /></PhoneColumn>
              <PhoneColumn caption="2 · Job checklist + photo proof"><JobScreen /></PhoneColumn>
              <PhoneColumn caption="3 · Report an issue"><IssuesScreen /></PhoneColumn>
              <PhoneColumn caption="4 · Chat with dispatch"><ChatScreen /></PhoneColumn>
            </div>
          </div>

          {/* manager backend */}
          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <SectionLabel>Management console · Web</SectionLabel>
            <ManagerConsole />
          </div>

        </div>
      </div>
    </AppProvider>
  );
}
