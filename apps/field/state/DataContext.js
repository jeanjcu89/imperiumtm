import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchJobs, fetchIssues, fetchMessages, fetchOpenEntry,
  setItemDone, setJobStatus, uploadItemPhoto, getPhotoUrl,
  clockIn as clockInRow, clockOut as clockOutRow, closeEntryById,
  addIssue as addIssueRow, sendMessage as sendMessageRow,
  subscribeCompany, makeTicketed,
} from '@imperium/shared';
import { useAuth } from './AuthContext.js';

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

// Live data for the signed-in CREW member. Mount only when a profile exists
// (subscribeCompany needs companyId and the user's token for RLS).
export function DataProvider({ children }) {
  const { client, profile } = useAuth();
  const [allJobs, setAllJobs] = useState([]);
  const [entry, setEntry] = useState(null); // { id, clockIn } while clocked in
  const [issues, setIssues] = useState([]);
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  // Generation counter for the clock: bumped by every clock action so a
  // slow clock-in insert can detect it was superseded (e.g. by clock-out).
  const genRef = useRef(0);

  useEffect(() => {
    if (!client || !profile) return;
    const ticketed = makeTicketed();
    const loadJobs = ticketed('jobs', () => fetchJobs(client), setAllJobs);
    const loadIssues = ticketed('issues', () => fetchIssues(client), setIssues);
    const loadMessages = ticketed('messages',
      () => fetchMessages(client, profile.id), setMessages);
    // Wrap the nullable row so `data: null` (clocked out) still applies.
    const loadEntry = ticketed('entry',
      () => fetchOpenEntry(client, profile.id)
        .then(({ data, error }) => ({ data: { open: data }, error })),
      ({ open }) => setEntry(open ? { id: open.id, clockIn: open.clock_in } : null));

    Promise.all([loadJobs(), loadIssues(), loadMessages(), loadEntry()])
      .then(() => setReady(true));

    const unsubscribe = subscribeCompany(client, profile.companyId, {
      jobs: loadJobs,
      checklist_items: loadJobs,
      issues: loadIssues,
      messages: loadMessages,
      time_entries: loadEntry,
    });
    return unsubscribe;
  }, [client, profile?.id, profile?.companyId]);

  const jobs = useMemo(
    () => allJobs.filter(j => j.assigneeId === profile?.id),
    [allJobs, profile?.id],
  );

  const value = useMemo(() => ({
    ready, jobs, issues, messages, entry,
    clockedIn: !!entry,
    clockStart: entry?.clockIn ?? null,

    // Optimistic toggle; first touch promotes the job todo -> inprogress.
    // A failed write emits no realtime event, so roll back locally and
    // hand the error to the screen — otherwise device and server diverge
    // silently (and a job could be "submitted" with unchecked server items).
    toggleItem: async (jobId, itemId) => {
      const job = allJobs.find(j => j.id === jobId);
      const item = job?.items.find(i => i.id === itemId);
      if (!job || !item) return {};
      const nextDone = !item.done;
      const promote = job.status === 'todo';
      const apply = (done, status) => setAllJobs(js => js.map(j => j.id !== jobId ? j : {
        ...j,
        status,
        items: j.items.map(x => x.id === itemId ? { ...x, done } : x),
      }));
      apply(nextDone, promote ? 'inprogress' : job.status);
      const { error } = await setItemDone(client, itemId, nextDone);
      if (error) {
        apply(item.done, job.status);
        return { error };
      }
      if (promote) {
        const { error: pErr } = await setJobStatus(client, jobId, 'inprogress');
        if (pErr) console.warn('[field] promote job:', pErr.message);
      }
      return {};
    },

    submitJob: async (jobId) => {
      const prev = allJobs.find(j => j.id === jobId)?.status;
      setAllJobs(js => js.map(j => j.id === jobId ? { ...j, status: 'submitted' } : j));
      const { error } = await setJobStatus(client, jobId, 'submitted');
      if (error && prev) {
        setAllJobs(js => js.map(j => j.id === jobId ? { ...j, status: prev } : j));
      }
      return { error };
    },

    // `body` is an ArrayBuffer (decoded base64 from the camera).
    uploadPhoto: async (jobId, itemId, body) => {
      const { data: path, error } = await uploadItemPhoto(client, {
        companyId: profile.companyId, jobId, itemId, body,
      });
      if (!error && path) {
        setAllJobs(js => js.map(j => j.id !== jobId ? j : {
          ...j,
          items: j.items.map(x => x.id === itemId ? { ...x, photoPath: path } : x),
        }));
      }
      return { data: path, error };
    },

    photoUrl: (path) => getPhotoUrl(client, path),

    clockIn: async () => {
      const gen = ++genRef.current;
      setEntry({ id: null, clockIn: new Date().toISOString() }); // optimistic
      const { data, error } = await clockInRow(client, {
        companyId: profile.companyId, employeeId: profile.id,
      });
      if (error) {
        if (gen === genRef.current) setEntry(null);
        return { error };
      }
      if (gen !== genRef.current) {
        // A clock-out (or another clock-in) raced past this insert:
        // close the row we just created instead of resurrecting it.
        await closeEntryById(client, data.id);
        return { data: null, error: null };
      }
      setEntry({ id: data.id, clockIn: data.clock_in });
      return { data, error: null };
    },

    clockOut: async () => {
      const gen = ++genRef.current;
      const prev = entry;
      setEntry(null); // optimistic
      // Closes every open entry for me — race-safe, no stale ids.
      const { error } = await clockOutRow(client, profile.id);
      if (error && gen === genRef.current) {
        // Failed write = still clocked in server-side; restore the timer
        // so the timesheet doesn't silently keep running.
        setEntry(prev);
      }
      return { error };
    },

    addIssue: async (body) => {
      const tmpId = 'tmp-' + Date.now();
      setIssues(list => [
        { id: tmpId, text: body, meta: 'Just now', author: profile.fullName },
        ...list,
      ]);
      const { error } = await addIssueRow(client, {
        companyId: profile.companyId, authorId: profile.id, body,
      });
      if (error) setIssues(list => list.filter(i => i.id !== tmpId));
      return { error };
    },

    // My thread: thread_id is my own profile id.
    sendMessage: async (body) => {
      const tmpId = 'tmp-' + Date.now();
      setMessages(list => [...list, {
        id: tmpId, text: body, senderId: profile.id,
        senderName: profile.fullName, senderRole: profile.role,
        createdAt: new Date().toISOString(),
      }]);
      const { error } = await sendMessageRow(client, {
        companyId: profile.companyId, threadId: profile.id, senderId: profile.id, body,
      });
      if (error) setMessages(list => list.filter(m => m.id !== tmpId));
      return { error };
    },
  }), [ready, jobs, issues, messages, entry, allJobs, client, profile]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
