import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import Header from '../components/Header.js';
import { useData } from '../state/DataContext.js';

export default function IssuesScreen() {
  const { issues, addIssue } = useData();
  const [text, setText] = useState('');

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    const { error } = (await addIssue(t)) ?? {};
    if (error) {
      setText(t); // restore so nothing is lost
      Alert.alert('Issue not sent', 'Check your connection and try again.');
    }
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
          <Pressable onPress={send} style={styles.sendBtn}>
            <Text style={styles.sendTxt}>Send to manager</Text>
          </Pressable>

          <Text style={styles.recent}>Recent</Text>
          <View style={{ gap: 9 }}>
            {issues.map(iss => (
              <View key={iss.id} style={styles.issueCard}>
                <Text style={styles.issueTxt}>{iss.text}</Text>
                <Text style={styles.issueMeta}>
                  {iss.author ? `${iss.author} · ${iss.meta}` : iss.meta}
                </Text>
              </View>
            ))}
            {issues.length === 0 ? (
              <Text style={{ fontSize: 12.5, color: '#a1927f' }}>No issues reported yet.</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  sendBtn: {
    marginTop: 10, borderRadius: 11, paddingVertical: 13,
    alignItems: 'center', backgroundColor: '#d96b2b',
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
});
