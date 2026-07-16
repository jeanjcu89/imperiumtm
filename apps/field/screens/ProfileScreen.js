import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { statusMeta, ymd, startOfWeek, addDays, entryHours, initials, updateOwnName, deleteOwnAccount } from '@imperium/shared';
import Header from '../components/Header.js';
import { useAuth } from '../state/AuthContext.js';
import { useData } from '../state/DataContext.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const shortDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtHours = (h) => h > 0 ? `${h.toFixed(1)}h` : '—';

export default function ProfileScreen({ navigation }) {
  const { client, profile, signOut, refreshProfile } = useAuth();
  const { jobs, timeEntries } = useData();
  // -6 clamp keeps paging inside the six-week window DataContext fetches.
  const [offset, setOffset] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // Apple 5.1.1(v): accounts created in-app must be deletable in-app.
  // Two-step confirm; the RPC enforces the last-manager guard server-side.
  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, sign-in, and personal data (hours, issue reports, messages). It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: doDeleteAccount },
      ],
    );
  };
  const doDeleteAccount = async () => {
    setDeleting(true);
    const { error } = (await deleteOwnAccount(client)) ?? {};
    setDeleting(false);
    if (error) {
      Alert.alert('Account not deleted', error.message);
      return;
    }
    signOut();   // session's user no longer exists; drop to the sign-in screen
  };

  const startNameEdit = () => { setNameDraft(profile?.fullName ?? ''); setEditingName(true); };
  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next || savingName) return;
    setSavingName(true);
    const { error } = (await updateOwnName(client, profile.id, next)) ?? {};
    if (!error) await refreshProfile();
    setSavingName(false);
    if (error) { Alert.alert('Name not saved', 'Check your connection and try again.'); return; }
    setEditingName(false);
  };

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), offset * 7), [offset]);
  const days = useMemo(() => DAY_NAMES.map((name, i) => {
    const date = addDays(weekStart, i);
    return { name, date, key: ymd(date) };
  }), [weekStart]);

  const { hoursByDay, weekTotal, jobsByDay } = useMemo(() => {
    const keys = new Set(days.map(d => d.key));
    const hoursByDay = {};
    let weekTotal = 0;
    for (const e of timeEntries) {
      const k = ymd(new Date(e.clockIn));
      if (!keys.has(k)) continue;
      const h = entryHours(e);
      hoursByDay[k] = (hoursByDay[k] ?? 0) + h;
      weekTotal += h;
    }
    const jobsByDay = {};
    for (const j of jobs) {
      if (j.scheduledDate && keys.has(j.scheduledDate)) (jobsByDay[j.scheduledDate] ??= []).push(j);
    }
    return { hoursByDay, weekTotal, jobsByDay };
  }, [days, jobs, timeEntries]);

  const weekLabel = offset === 0
    ? 'This week'
    : `${shortDate(weekStart)} – ${shortDate(addDays(weekStart, 6))}`;
  const atMin = offset <= -6;

  return (
    <View style={{ flex: 1, backgroundColor: '#faf7f2' }}>
      <Header heading="Your profile" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 26, gap: 16 }}>

        {/* who */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials(profile?.fullName ?? '')}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  autoFocus
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor="#a1927f"
                />
              ) : (
                <Text style={styles.name}>{profile?.fullName ?? 'You'}</Text>
              )}
              <Text style={styles.role}>{profile?.role === 'manager' ? 'Manager' : 'Crew'}{profile?.companyName ? ` · ${profile.companyName}` : ''}</Text>
            </View>
            {editingName ? (
              <View style={{ gap: 6 }}>
                <Pressable onPress={saveName} disabled={savingName || !nameDraft.trim()} style={[styles.nameBtn, { backgroundColor: '#d96b2b', borderColor: '#d96b2b', opacity: savingName || !nameDraft.trim() ? 0.6 : 1 }]}>
                  <Text style={[styles.nameBtnTxt, { color: '#fff' }]}>{savingName ? 'Saving…' : 'Save'}</Text>
                </Pressable>
                <Pressable onPress={() => setEditingName(false)} style={styles.nameBtn}>
                  <Text style={styles.nameBtnTxt}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={startNameEdit} style={styles.nameBtn}>
                <Text style={styles.nameBtnTxt}>Edit</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* hours this week */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HOURS · {weekLabel.toUpperCase()}</Text>
          <Text style={styles.hoursBig}>{weekTotal > 0 ? `${weekTotal.toFixed(1)} h` : '0 h'}</Text>
          <View style={styles.hoursRow}>
            {days.map(d => (
              <View key={d.key} style={styles.hoursCell}>
                <Text style={styles.hoursCellDay}>{d.name[0]}</Text>
                <Text style={styles.hoursCellVal}>{fmtHours(hoursByDay[d.key] ?? 0)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* week nav */}
        <View style={styles.weekNav}>
          <Pressable onPress={() => setOffset(o => Math.max(-6, o - 1))} disabled={atMin} style={[styles.navBtn, atMin && { opacity: 0.4 }]}>
            <Text style={styles.navBtnTxt}>{'‹'}</Text>
          </Pressable>
          <Pressable onPress={() => setOffset(o => o + 1)} style={styles.navBtn}>
            <Text style={styles.navBtnTxt}>{'›'}</Text>
          </Pressable>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          {offset !== 0 ? (
            <Pressable onPress={() => setOffset(0)} hitSlop={8}><Text style={styles.today}>Today</Text></Pressable>
          ) : null}
        </View>

        {/* weekly schedule */}
        <View style={{ gap: 10 }}>
          {days.map(d => {
            const list = jobsByDay[d.key] ?? [];
            return (
              <View key={d.key} style={styles.dayCard}>
                <View style={styles.dayHead}>
                  <Text style={styles.dayName}>{d.name} {d.date.getDate()}</Text>
                  <Text style={styles.dayCount}>{list.length === 0 ? 'No jobs' : `${list.length} job${list.length === 1 ? '' : 's'}`}</Text>
                </View>
                {list.map(job => {
                  const m = statusMeta(job.status);
                  return (
                    <Pressable key={job.id} onPress={() => navigation.navigate('JobDetail', { jobId: job.id })} style={styles.jobRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.jobClient} numberOfLines={1}>{job.client}</Text>
                        <Text style={styles.jobMeta} numberOfLines={1}>
                          {[job.time, job.estimatedHours ? `${job.estimatedHours}h` : null].filter(Boolean).join(' · ') || 'No time set'}
                        </Text>
                      </View>
                      <View style={[styles.pill, { backgroundColor: m.bg }]}>
                        <Text style={[styles.pillTxt, { color: m.fg }]}>{m.label.toUpperCase()}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>

        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutTxt}>Sign out</Text>
        </Pressable>

        <Pressable onPress={confirmDeleteAccount} disabled={deleting} style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}>
          <Text style={styles.deleteTxt}>{deleting ? 'Deleting account…' : 'Delete account'}</Text>
        </Pressable>
        <Text style={styles.deleteNote}>
          Permanently removes your account and personal data. Photos attached
          to your company’s jobs remain part of its work records.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece5db',
    borderRadius: 14, padding: 15,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#f3e2d2',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontWeight: '700', color: '#b85618', fontSize: 16 },
  name: { fontWeight: '800', fontSize: 17, color: '#2a211b' },
  nameInput: {
    fontWeight: '800', fontSize: 17, color: '#2a211b', padding: 0, margin: 0,
    borderBottomWidth: 2, borderBottomColor: '#d96b2b',
  },
  nameBtn: {
    borderWidth: 1, borderColor: '#e0d3c2', backgroundColor: '#fff',
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 13,
  },
  nameBtnTxt: { fontSize: 12, fontWeight: '700', color: '#8a7d70' },
  role: { fontSize: 12, color: '#8a7d70', marginTop: 2 },
  cardLabel: { fontSize: 10.5, letterSpacing: 0.6, fontWeight: '700', color: '#a1927f' },
  hoursBig: { fontWeight: '800', fontSize: 30, color: '#2a211b', marginTop: 4, fontVariant: ['tabular-nums'] },
  hoursRow: { flexDirection: 'row', marginTop: 12, gap: 4 },
  hoursCell: { flex: 1, alignItems: 'center', gap: 3 },
  hoursCellDay: { fontSize: 10, fontWeight: '700', color: '#a1927f' },
  hoursCellVal: { fontSize: 11, color: '#3a2c20', fontVariant: ['tabular-nums'] },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#e0d3c2',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  navBtnTxt: { fontSize: 16, fontWeight: '700', color: '#8a7d70', marginTop: -2 },
  weekLabel: { fontWeight: '700', fontSize: 14, color: '#2a211b' },
  today: { color: '#b85618', fontWeight: '700', fontSize: 12 },
  dayCard: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece5db',
    borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, gap: 9,
  },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  dayName: { fontWeight: '700', fontSize: 13.5, color: '#2a211b' },
  dayCount: { fontSize: 11, color: '#a1927f', fontWeight: '600' },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: '#f4ede3', paddingTop: 9,
  },
  jobClient: { fontSize: 13.5, fontWeight: '600', color: '#2a211b' },
  jobMeta: { fontSize: 11, color: '#8a7d70', marginTop: 2 },
  pill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20, flex: 0 },
  pillTxt: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4 },
  signOut: {
    marginTop: 6, borderRadius: 11, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: '#e0d3c2', backgroundColor: '#fff',
  },
  signOutTxt: { color: '#8a7d70', fontWeight: '700', fontSize: 13.5 },
  deleteBtn: {
    marginTop: 10, borderRadius: 11, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: '#e7c4c4', backgroundColor: '#fff',
  },
  deleteTxt: { color: '#b04a3a', fontWeight: '700', fontSize: 13.5 },
  deleteNote: {
    fontSize: 11, color: '#a1927f', textAlign: 'center', lineHeight: 16,
    marginTop: 8, marginBottom: 4, paddingHorizontal: 10,
  },
});
