import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchProfile, resetPassword, signIn, signOut, signUpWithInvite } from '@imperium/shared';
import { client } from '../lib/client.js';

// Recovery links open the manager console in a browser — it hosts the
// set-new-password screen for every role (deep-linking recovery tokens into
// a native app is fragile; the new password then works here too).
const RECOVERY_URL = 'https://app.imperiumtm.com';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// RN mirror of the console's AuthProvider: session from AsyncStorage-backed
// supabase auth, profile loaded once a session exists.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) { setProfile(null); setLoading(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    fetchProfile(client).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('[auth] profile load:', error.message);
      setProfile(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  // Re-pull the profile after a name edit so headers update without a reload.
  const refreshProfile = () =>
    fetchProfile(client).then(({ data }) => { if (data) setProfile(data); });

  const value = {
    client,
    configured: !!client,
    session,
    profile,
    loading,
    refreshProfile,
    signIn: (creds) => signIn(client, creds),
    signUpWithInvite: (params) => signUpWithInvite(client, params),
    resetPassword: (email) => resetPassword(client, email, RECOVERY_URL),
    signOut: () => signOut(client),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
