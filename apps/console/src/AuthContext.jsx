import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchProfile, signIn, signOut, signUpCompany } from '@imperium/shared';
import { client } from './lib/client.js';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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

  // Re-pull the profile after Settings edits so the sidebar (name, company)
  // updates without a reload. Resolves with the result so callers (billing
  // activation poll) can inspect the fresh plan.
  const refreshProfile = () =>
    fetchProfile(client).then((res) => { if (res.data) setProfile(res.data); return res; });

  const value = {
    client,
    configured: !!client,
    session,
    profile,
    loading,
    refreshProfile,
    signIn: (creds) => signIn(client, creds),
    signUpCompany: (params) => signUpCompany(client, params),
    signOut: () => signOut(client),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
