import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { timeMeta } from '@imperium/shared';
import Header from '../components/Header.js';
import PhotoViewer from '../components/PhotoViewer.js';
import { useData } from '../state/DataContext.js';

// Signed-URL thumbnail for an issue that has a stored photo; tap to view it
// full-screen (with its timestamp) via onOpen.
function IssueThumb({ path, onOpen }) {
  const { photoUrl } = useData();
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let on = true;
    setUrl(null);
    photoUrl(path).then(({ data }) => { if (on) setUrl(data); });
    return () => { on = false; };
  }, [path]);
  return (
    <Pressable onPress={url ? () => onOpen(url) : undefined} style={styles.thumb}>
      {url
        ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <ActivityIndicator size="small" color="#b85618" />}
    </Pressable>
  );
}

export default function IssuesScreen() {
  const { issues, addIssue } = useData();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);   // { uri, base64 } or null
  const [sending, setSending] = useState(false);
  const [viewer, setViewer] = useState(null); // { url, title, takenAt } or null

  // Same capture flow as the checklist photos: try the camera, fall back to
  // the library (simulator / permission denied / no camera).
  const attachPhoto = async () => {
    let result = null;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('camera permission denied');
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
    } catch {
      try {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
      } catch {
        result = null;
      }
    }
    const asset = !result || result.canceled ? null : result.assets?.[0];
    if (asset?.base64) setPhoto({ uri: asset.uri, base64: asset.base64 });
  };

  const send = async () => {
    const t = text.trim();
    if ((!t && !photo) || sending) return;
    setSending(true);
    const body = photo ? decode(photo.base64) : undefined;
    const { error } = (await addIssue(t, body)) ?? {};
    setSending(false);
    if (error) {
      Alert.alert('Issue not sent', 'Check your connection and try again.');
      return; // keep text + photo so nothing is lost
    }
    setText('');
    setPhoto(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#faf7f2' }}>
      <Header heading="Issues" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 26 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Report an issue</Text>
          <Text style={styles.sub}>
            Flag anything blocking the job — missing supplies, access problems, damage.
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Describe the issue…"
            placeholderTextColor="#a1927f"
            multiline
            textAlignVertical="top"
            style={styles.textarea}
          />

          {photo ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />
              <Pressable onPress={() => setPhoto(null)} hitSlop={8} style={styles.removeBtn}>
                <Text style={styles.removeTxt}>{'✕'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={attachPhoto} style={styles.attachBtn}>
              <View style={styles.attachIcon} />
              <Text style={styles.attachTxt}>Add photo</Text>
            </Pressable>
          )}

          <Pressable onPress={send} disabled={sending} style={[styles.sendBtn, sending && { opacity: 0.6 }]}>
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendTxt}>Send to manager</Text>}
          </Pressable>

          <Text style={styles.recent}>Recent</Text>
          <View style={{ gap: 9 }}>
            {issues.map(iss => (
              <View key={iss.id} style={styles.issueCard}>
                <View style={{ flexDirection: 'row', gap: 11 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <Text style={[styles.issueTxt, { flexShrink: 1 }]}>{iss.text}</Text>
                      {iss.resolvedAt ? (
                        <View style={styles.resolvedPill}><Text style={styles.resolvedTxt}>RESOLVED</Text></View>
                      ) : null}
                    </View>
                    <Text style={styles.issueMeta}>
                      {iss.author ? `${iss.author} · ${iss.meta}` : iss.meta}
                    </Text>
                  </View>
                  {iss.photoPath ? (
                    <IssueThumb path={iss.photoPath} onOpen={(url) =>
                      setViewer({ url, title: iss.text, takenAt: iss.meta })} />
                  ) : null}
                </View>
                {iss.reply ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyMeta}>
                      Manager{iss.repliedAt ? ` · ${timeMeta(iss.repliedAt)}` : ''}
                    </Text>
                    <Text style={styles.replyTxt}>{iss.reply}</Text>
                  </View>
                ) : null}
              </View>
            ))}
            {issues.length === 0 ? (
              <Text style={{ fontSize: 12.5, color: '#a1927f' }}>No issues reported yet.</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', fontSize: 19, color: '#2a211b', marginBottom: 4 },
  sub: { fontSize: 12, color: '#8a7d70', marginBottom: 14, lineHeight: 17 },
  textarea: {
    height: 96, borderWidth: 1, borderColor: '#ece5db', borderRadius: 12,
    padding: 12, fontSize: 14, backgroundColor: '#fff', color: '#2a211b',
  },
  attachBtn: {
    marginTop: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#d8c5ad',
    backgroundColor: '#fdfbf7', borderRadius: 11, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  attachIcon: { width: 16, height: 13, borderWidth: 1.5, borderColor: '#b85618', borderRadius: 3 },
  attachTxt: { color: '#b85618', fontSize: 12.5, fontWeight: '700' },
  previewWrap: { marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  preview: { width: '100%', height: 150, borderRadius: 12 },
  removeBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(42,33,27,.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sendBtn: {
    marginTop: 10, borderRadius: 11, paddingVertical: 13, minHeight: 46,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#d96b2b',
  },
  sendTxt: { fontWeight: '700', fontSize: 14, color: '#fff' },
  recent: {
    fontWeight: '700', fontSize: 14, color: '#2a211b',
    marginTop: 20, marginBottom: 10, marginHorizontal: 2,
  },
  issueCard: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece5db',
    borderRadius: 12, padding: 12,
  },
  issueTxt: { fontSize: 13, color: '#2a211b', lineHeight: 18 },
  issueMeta: { fontSize: 10.5, color: '#a1927f', marginTop: 6, fontVariant: ['tabular-nums'] },
  resolvedPill: {
    backgroundColor: '#e2efe5', borderRadius: 20,
    paddingVertical: 2, paddingHorizontal: 7,
  },
  resolvedTxt: { fontSize: 8.5, fontWeight: '700', color: '#4f8a5b', letterSpacing: 0.5 },
  replyBox: {
    marginTop: 10, backgroundColor: '#faf7f2', borderLeftWidth: 3,
    borderLeftColor: '#d96b2b', borderTopRightRadius: 9, borderBottomRightRadius: 9,
    paddingVertical: 8, paddingHorizontal: 11,
  },
  replyMeta: { fontSize: 10, fontWeight: '700', color: '#b85618', letterSpacing: 0.4, textTransform: 'uppercase' },
  replyTxt: { fontSize: 13, color: '#2a211b', lineHeight: 18, marginTop: 3 },
  thumb: {
    width: 46, height: 46, borderRadius: 9, backgroundColor: '#e9dccd',
    borderWidth: 1, borderColor: '#e4d6c4', overflow: 'hidden', flex: 0,
    alignItems: 'center', justifyContent: 'center',
  },
});
