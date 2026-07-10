import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchJobs, fetchTeam, fetchIssues, fetchInvites,
  createJob, setJobStatus, resetJobItems, deleteJob, createInvite,
  subscribeCompany, makeTicketed,
} from '@imperium/shared';
import { useAuth } from './AuthContext.jsx';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

// Company-scoped live data for the console. Mount only when a profile exists.
export function DataProvider({ children }) {
  const { client, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [team, setTeam] = useState([]);
  const [issues, setIssues] = useState([]);
  const [invites, setInvites] = useState([]);
  const [ready, setReady] = useState(false);
  // Bumped on every realtime messages event; the Inbox refetches on change.
  const [messagesVersion, setMessagesVersion] = useState(0);

  useEffect(() => {
    if (!client || !profile) return;
    const ticketed = makeTicketed();
    const loadJobs = ticketed('jobs', () => fetchJobs(client), setJobs);
    const loadTeam = ticketed('team', () => fetchTeam(client), setTeam);
    const loadIssues = ticketed('issues', () => fetchIssues(client), setIssues);
    const loadInvites = ticketed('invites',
      () => fetchInvites(client).then(({ data, error }) => ({ data, error })),
      setInvites);

    Promise.all([loadJobs(), loadTeam(), loadIssues(), loadInvites()])
      .then(() => setReady(true));

    const unsubscribe = subscribeCompany(client, profile.companyId, {
      jobs: loadJobs,
      checklist_items: loadJobs,
      issues: loadIssues,
      profiles: loadTeam,
      invites: loadInvites,
      messages: () => setMessagesVersion(v => v + 1),
    });
    return unsubscribe;
  }, [client, profile?.companyId]);

  const value = useMemo(() => ({
    ready, jobs, team, issues, invites, messagesVersion,
    createJob: (params) => createJob(client, { companyId: profile.companyId, ...params }),
    approveJob: (jobId) => setJobStatus(client, jobId, 'approved'),
    rejectJob: async (jobId) => {
      const first = await setJobStatus(client, jobId, 'inprogress');
      if (first.error) return first;
      return resetJobItems(client, jobId);
    },
    deleteJob: (jobId) => deleteJob(client, jobId),
    createInvite: (role = 'crew') =>
      createInvite(client, { companyId: profile.companyId, createdBy: profile.id, role }),
  }), [ready, jobs, team, issues, invites, messagesVersion, client, profile?.companyId, profile?.id]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
