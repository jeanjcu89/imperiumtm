import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { prog, statusMeta } from '@imperium/shared';
import Header from '../components/Header.js';
import { useAuth } from '../state/AuthContext.js';
import { useData } from '../state/DataContext.js';

function pad(n) { return String(n).padStart(2, '0'); }

function JobCard({ job, onPress }) {
  const p = prog(job);
  const m = statusMeta(job.status);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardClient}>{job.client}</Text>
          <Text style={styles.cardAddress}>{job.address}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: m.bg }]}>
          <Text style={[styles.pillTxt, { color: m.fg }]}>{m.label.toUpperCase()}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <Text style={styles.cardTime}>{job.time}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: p.pct }]} />
        </View>
        <Text style={styles.progTxt}>{p.text}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const { ready, jobs, clockedIn, clockStart, clockIn, clockOut } = useData();
  const [, setTick] = useState(0);

  // tick every second while on the clock
  useEffect(() => {
    if (!clockedIn) return;
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [clockedIn]);

  let timeStr = '—';
  if (clockedIn && clockStart) {
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(clockStart).getTime()) / 1000));
    timeStr = pad(Math.floor(elapsed / 3600)) + ':' + pad(Math.floor((elapsed % 3600) / 60)) + ':' + pad(elapsed % 60);
  }

  const firstName = (profile?.fullName ?? '').split(/\s+/)[0] || 'there';
  const clock = clockedIn
    ? { status: 'On the clock', bg: '#3a2c20', fg: '#faf7f2', btnBg: '#d96b2b', btnFg: '#fff', btnLabel: 'Clock out' }
    : { status: 'Clocked out', bg: '#fff', fg: '#2a211b', btnBg: '#3a2c20', btnFg: '#fff', btnLabel: ready ? 'Clock in' : 'Loading…' };

  // Until the first fetch resolves we don't know the real clock state —
  // acting on the button then could open a duplicate time entry.
  const toggleClock = async () => {
    if (!ready) return;
    const { error } = (await (clockedIn ? clockOut() : clockIn())) ?? {};
    if (error) {
      Alert.alert('Clock', `Could not ${clockedIn ? 'clock out' : 'clock in'} — check your connection and try again.`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#faf7f2' }}>
      <Header heading={`Good morning, ${firstName}`} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 22, gap: 16 }}>

        {/* clock card */}
        <View style={[styles.clockCard, { backgroundColor: clock.bg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={[styles.clockStatus, { color: clock.fg }]}>{clock.status.toUpperCase()}</Text>
              <Text style={[styles.clockTime, { color: clock.fg }]}>{timeStr}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.clockSide, { color: clock.fg }]}>Today</Text>
              <Text style={[styles.clockSideBig, { color: clock.fg }]}>{jobs.length} job{jobs.length === 1 ? '' : 's'}</Text>
            </View>
          </View>
          <Pressable
            onPress={toggleClock}
            disabled={!ready}
            style={[styles.clockBtn, { backgroundColor: clock.btnBg, opacity: ready ? 1 : 0.6 }]}
          >
            <Text style={{ color: clock.btnFg, fontSize: 15, fontWeight: '700' }}>{clock.btnLabel}</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={styles.sectionTitle}>Today's jobs</Text>
          <Text style={styles.sectionMeta}>{jobs.length} assigned</Text>
        </View>

        {jobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
          />
        ))}

        {jobs.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 26 }]}>
            <Text style={{ fontSize: 13, color: '#8a7d70' }}>
              {ready ? 'No jobs assigned to you yet.' : 'Loading your jobs…'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  clockCard: {
    borderRadius: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 15,
    shadowColor: '#3a2c20', shadowOpacity: 0.1, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  clockStatus: { fontSize: 11, letterSpacing: 1.3, opacity: 0.75, fontWeight: '600' },
  clockTime: { fontWeight: '800', fontSize: 32, letterSpacing: -0.5, marginTop: 3, fontVariant: ['tabular-nums'] },
  clockSide: { fontSize: 11, opacity: 0.8 },
  clockSideBig: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  clockBtn: { marginTop: 14, borderRadius: 11, paddingVertical: 13, alignItems: 'center' },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: '#2a211b' },
  sectionMeta: { fontSize: 12, color: '#a1927f', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece5db',
    borderRadius: 14, padding: 14,
    shadowColor: '#3a2c20', shadowOpacity: 0.04, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardClient: { fontWeight: '700', fontSize: 15, lineHeight: 18, color: '#2a211b' },
  cardAddress: { fontSize: 12, color: '#8a7d70', marginTop: 3 },
  pill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20 },
  pillTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  cardTime: { fontSize: 12, fontWeight: '700', color: '#3a2c20' },
  track: { flex: 1, height: 6, backgroundColor: '#f0e7dc', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#d96b2b', borderRadius: 6 },
  progTxt: { fontSize: 11, color: '#a1927f', fontWeight: '600' },
});
