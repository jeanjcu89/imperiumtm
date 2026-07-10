import React from 'react';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { DataProvider } from './DataContext.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import ConsoleShell from './console/ConsoleShell.jsx';

const franklin = "'Libre Franklin',sans-serif";

function Center({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>{children}</div>
  );
}

function Gate() {
  const { configured, loading, session, profile } = useAuth();

  if (!configured) {
    return (
      <Center>
        <div style={{ maxWidth: 460, textAlign: 'center', color: '#8a7d70', fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 20, color: '#2a211b', marginBottom: 8 }}>
            Imperium Console
          </div>
          Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> in the repo root <code>.env</code>, then restart.
        </div>
      </Center>
    );
  }

  if (loading) {
    return <Center><div style={{ color: '#a1927f', fontSize: 14 }}>Loading…</div></Center>;
  }

  if (!session || !profile) return <AuthScreen />;

  if (profile.role !== 'manager') {
    return (
      <Center>
        <div style={{ maxWidth: 460, textAlign: 'center', color: '#8a7d70', fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ fontFamily: franklin, fontWeight: 800, fontSize: 20, color: '#2a211b', marginBottom: 8 }}>
            Crew account
          </div>
          This console is for managers. Crew members use the Imperium field app on their phone.
        </div>
      </Center>
    );
  }

  return (
    <DataProvider>
      <ConsoleShell />
    </DataProvider>
  );
}

export default function App() {
  // Dev-only design preview with mock data: `npm run dev` + /?mock=1.
  // import.meta.env.DEV is compile-time false in production builds, so
  // the mock module is tree-shaken out of deploys entirely.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock')) {
    const DevPreview = React.lazy(() => import('./dev/DevPreview.jsx'));
    return (
      <React.Suspense fallback={null}>
        <DevPreview />
      </React.Suspense>
    );
  }

  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
