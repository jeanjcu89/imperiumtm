import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { prog, statusMeta } from '@imperium/shared';
import Header from '../components/Header.js';
import { useData } from '../state/DataContext.js';

function ItemPhoto({ path, busy, onRetake }) {
  const { photoUrl } = useData();
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let on = true;
    setUrl(null);
    photoUrl(path).then(({ data }) => { if (on) setUrl(data); });
    return () => { on = false; };
  }, [path]);

  return (
    <View style={styles.photoBox}>
      {url
        ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color="#b85618" />
          </View>}
      <View style={styles.photoBar}>
        <Text style={styles.photoBarTxt}>photo</Text>
        {onRetake ? (
          <Pressable onPress={onRetake} disabled={busy} style={styles.retakeBtn}>
            {busy
              ? <ActivityIndicator size="small" color="#3a2c20" />
              : <Text style={styles.retakeTxt}>Retake</Text>}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ChecklistItem({ item, jobId, busy, locked, onToggle, onPhoto }) {
  return (
    <View style={[styles.itemCard, { borderColor: item.done ? '#f0e7dc' : '#ece5db' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <Pressable
          onPress={onToggle}
          disabled={locked}
          style={[styles.check, item.done
            ? { borderColor: '#d96b2b', backgroundColor: '#d96b2b' }
            : { borderColor: '#d8c5ad', backgroundColor: '#fff' },
            locked && { opacity: 0.6 }]}
        >
          {item.done ? <Text style={styles.checkMark}>{'✓'}</Text> : null}
        </Pressable>
        <Text style={[styles.itemLabel, item.done && {
          color: '#a1927f', textDecorationLine: 'line-through',
        }]}>{item.label}</Text>
      </View>
      <View style={{ marginTop: 11, marginLeft: 37 }}>
        {item.photoPath ? (
          <ItemPhoto path={item.photoPath} busy={busy} onRetake={locked ? null : onPhoto} />
        ) : locked ? (
          <View style={[styles.addPhoto, { opacity: 0.5 }]}>
            <Text style={styles.addPhotoTxt}>No photo</Text>
          </View>
        ) : (
          <Pressable onPress={onPhoto} disabled={busy} style={styles.addPhoto}>
            {busy
              ? <ActivityIndicator size="small" color="#b85618" />
              : (
                <>
                  <View style={styles.addPhotoIcon} />
                  <Text style={styles.addPhotoTxt}>Add photo</Text>
                </>
              )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params ?? {};
  const { jobs, toggleItem, submitJob, uploadPhoto } = useData();
  const job = jobs.find(j => j.id === jobId);
  const [busyItem, setBusyItem] = useState(null);
  const [photoErr, setPhotoErr] = useState('');

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: '#faf7f2' }}>
        <Header heading="Current job" onBack={() => navigation.goBack()} />
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ color: '#8a7d70', fontSize: 13 }}>This job is no longer assigned to you.</Text>
        </View>
      </View>
    );
  }

  const p = prog(job);
  const m = statusMeta(job.status);
  const allDone = job.items.length > 0 && job.items.every(i => i.done);
  const submitted = job.status === 'submitted' || job.status === 'approved';

  const capturePhoto = async (item) => {
    if (busyItem) return;
    setPhotoErr('');
    let result = null;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('camera permission denied');
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], quality: 0.6, base64: true,
      });
    } catch {
      // Permission denied or no camera (simulator/web): fall back to library.
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], quality: 0.6, base64: true,
        });
      } catch {
        result = null;
      }
    }
    const asset = !result || result.canceled ? null : result.assets?.[0];
    if (!asset?.base64) return;

    setBusyItem(item.id);
    try {
      const { error } = await uploadPhoto(job.id, item.id, decode(asset.base64));
      if (error) setPhotoErr('Photo upload failed: ' + error.message);
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#faf7f2' }}>
      <Header heading="Current job" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 26 }}>

        {/* job summary */}
        <View style={styles.summary}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.client}>{job.client}</Text>
              <Text style={styles.address}>{job.address}{job.time ? ` · ${job.time}` : ''}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: m.bg }]}>
              <Text style={[styles.pillTxt, { color: m.fg }]}>{m.label.toUpperCase()}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 }}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: p.pct }]} />
            </View>
            <Text style={styles.progTxt}>{p.text}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Checklist · photo proof per item</Text>
        {photoErr ? <Text style={styles.photoErr}>{photoErr}</Text> : null}

        <View style={{ gap: 10 }}>
          {job.items.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              jobId={job.id}
              busy={busyItem === item.id}
              locked={submitted}
              onToggle={async () => {
                const { error } = (await toggleItem(job.id, item.id)) ?? {};
                if (error) setPhotoErr('Could not save the change — check your connection.');
              }}
              onPhoto={() => capturePhoto(item)}
            />
          ))}
        </View>

        <Pressable
          onPress={async () => {
            const { error } = (await submitJob(job.id)) ?? {};
            if (error) setPhotoErr('Could not submit — check your connection and try again.');
          }}
          disabled={submitted || !allDone}
          style={[styles.submit, {
            backgroundColor: submitted ? '#e2efe5' : (allDone ? '#4f8a5b' : '#e6ded3'),
          }]}
        >
          <Text style={{
            fontSize: 15, fontWeight: '800',
            color: submitted ? '#4f8a5b' : (allDone ? '#fff' : '#b6a48f'),
          }}>
            {submitted ? 'Submitted for review' : (allDone ? 'Submit completed job' : 'Complete all items to submit')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece5db',
    borderRadius: 14, padding: 15, marginBottom: 14,
  },
  client: { fontWeight: '800', fontSize: 18, lineHeight: 21, color: '#2a211b' },
  address: { fontSize: 12, color: '#8a7d70', marginTop: 4 },
  pill: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 20 },
  pillTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  track: { flex: 1, height: 7, backgroundColor: '#f0e7dc', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#d96b2b', borderRadius: 6 },
  progTxt: { fontSize: 12, color: '#a1927f', fontWeight: '700' },
  sectionTitle: {
    fontWeight: '700', fontSize: 14, color: '#2a211b',
    marginTop: 4, marginBottom: 10, marginHorizontal: 2,
  },
  photoErr: { color: '#b3402e', fontSize: 12, fontWeight: '600', marginBottom: 8, marginHorizontal: 2 },
  itemCard: {
    backgroundColor: '#fff', borderWidth: 1, borderRadius: 13,
    paddingVertical: 12, paddingHorizontal: 13,
  },
  check: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 18 },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2a211b' },
  photoBox: {
    height: 96, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#e9dccd', borderWidth: 1, borderColor: '#e4d6c4',
    justifyContent: 'flex-end',
  },
  photoBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 9, backgroundColor: 'rgba(58,44,32,.45)',
  },
  photoBarTxt: { color: '#fff', fontSize: 10 },
  retakeBtn: {
    backgroundColor: 'rgba(255,255,255,.9)', borderRadius: 6,
    paddingVertical: 3, paddingHorizontal: 7,
  },
  retakeTxt: { fontSize: 10, fontWeight: '700', color: '#3a2c20' },
  addPhoto: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#d8c5ad',
    backgroundColor: '#fdfbf7', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addPhotoIcon: { width: 16, height: 13, borderWidth: 1.5, borderColor: '#b85618', borderRadius: 3 },
  addPhotoTxt: { color: '#b85618', fontSize: 12.5, fontWeight: '700' },
  submit: {
    marginTop: 18, borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
});
