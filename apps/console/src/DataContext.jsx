import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchJobs, fetchTeam, fetchIssues, fetchInvites,
  fetchClients, fetchTemplates, fetchTimeEntries,
  createJobs, setJobStatus, resetJobItems, deleteJob, createInvite,
  addClient, updateClient, deleteClient,
  addTemplate, updateTemplate, deleteTemplate,
  replyToIssue, setIssueResolved, updateMember,
  subscribeCompany, makeTicketed, startOfWeek, addDays,
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
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [ready, setReady] = useState(false);
  // Bumped on every realtime messages event; the Inbox refetches on change.
  const [messagesVersion, setMessagesVersion] = useState(0);

  useEffect(() => {
    if (!client || !profile) return;
    // Hours & Reports look back six weeks; that also covers the current week.
    const sinceISO = addDays(startOfWeek(new Date()), -42).toISOString();
    const ticketed = makeTicketed();
    const loadJobs = ticketed('jobs', () => fetchJobs(client), setJobs);
    const loadTeam = ticketed('team', () => fetchTeam(client), setTeam);
    const loadIssues = ticketed('issues', () => fetchIssues(client), setIssues);
    const loadInvites = ticketed('invites', () => fetchInvites(client), setInvites);
    const loadClients = ticketed('clients', () => fetchClients(client), setClients);
    const loadTemplates = ticketed('templates', () => fetchTemplates(client), setTemplates);
    const loadTimeEntries = ticketed('time_entries', () => fetchTimeEntries(client, sinceISO), setTimeEntries);

    Promise.all([
      loadJobs(), loadTeam(), loadIssues(), loadInvites(),
      loadClients(), loadTemplates(), loadTimeEntries(),
    ]).then(() => setReady(true));

    const unsubscribe = subscribeCompany(client, profile.companyId, {
      jobs: loadJobs,
      checklist_items: loadJobs,
      issues: loadIssues,
      profiles: loadTeam,
      invites: loadInvites,
      clients: loadClients,
      checklist_templates: loadTemplates,
      template_items: loadTemplates,
      time_entries: loadTimeEntries,
      messages: () => setMessagesVersion(v => v + 1),
    });
    return unsubscribe;
  }, [client, profile?.companyId]);

  const value = useMemo(() => ({
    ready, jobs, team, issues, invites, clients, templates, timeEntries, messagesVersion,
    createJob: (params) => createJobs(client, { companyId: profile.companyId, ...params }),
    approveJob: (jobId) => setJobStatus(client, jobId, 'approved'),
    rejectJob: async (jobId) => {
      const first = await setJobStatus(client, jobId, 'inprogress');
      if (first.error) return first;
      return resetJobItems(client, jobId);
    },
    deleteJob: (jobId) => deleteJob(client, jobId),
    createInvite: (role = 'crew') =>
      createInvite(client, { companyId: profile.companyId, createdBy: profile.id, role }),
    addClient: (params) => addClient(client, { companyId: profile.companyId, ...params }),
    updateClient: (id, patch) => updateClient(client, id, patch),
    deleteClient: (id) => deleteClient(client, id),
    addTemplate: (params) => addTemplate(client, { companyId: profile.companyId, ...params }),
    updateTemplate: (params) => updateTemplate(client, { companyId: profile.companyId, ...params }),
    deleteTemplate: (id) => deleteTemplate(client, id),
    replyToIssue: (id, reply) => replyToIssue(client, { id, reply, repliedBy: profile.id }),
    setIssueResolved: (id, resolved) => setIssueResolved(client, id, resolved),
    updateMember: (id, patch) => updateMember(client, id, patch),
  }), [ready, jobs, team, issues, invites, clients, templates, timeEntries,
    messagesVersion, client, profile?.companyId, profile?.id]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
