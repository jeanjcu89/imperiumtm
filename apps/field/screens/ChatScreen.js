import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { notify } from '../lib/dialogs.js';
import { clockLabel } from '@imperium/shared';
import Header from '../components/Header.js';
import { useAuth } from '../state/AuthContext.js';
import { useData } from '../state/DataContext.js';

export default function ChatScreen() {
  const { profile } = useAuth();
  const { messages, sendMessage } = useData();
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    const { error } = (await sendMessage(t)) ?? {};
    if (error) {
      setText(t); // restore so nothing is lost
      notify('Message not sent', 'Check your connection and try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#faf7f2' }}>
      <Header heading="Messages" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={listRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map(m => {
            const mine = m.senderId === profile?.id;
            return (
              <View key={m.id} style={{
                alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%',
              }}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={{ color: mine ? '#fff' : '#2a211b', fontSize: 13.5, lineHeight: 19 }}>
                    {m.text}
                  </Text>
                </View>
                <Text style={[styles.who, { textAlign: mine ? 'right' : 'left' }]}>
                  {(mine ? 'You' : m.senderName) + ' · ' + clockLabel(m.createdAt)}
                </Text>
              </View>
            );
          })}
          {messages.length === 0 ? (
            <Text style={{ fontSize: 12.5, color: '#a1927f', textAlign: 'center', marginTop: 24 }}>
              No messages yet. Say hi to dispatch.
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            placeholder="Message dispatch…"
            placeholderTextColor="#a1927f"
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable onPress={send} style={styles.sendBtn}>
            <Text style={{ color: '#fff', fontSize: 17, lineHeight: 20 }}>{'↑'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14 },
  bubbleMine: { backgroundColor: '#d96b2b' },
  bubbleTheirs: { backgroundColor: '#fff' },
  who: { fontSize: 10, color: '#a1927f', marginTop: 3, fontVariant: ['tabular-nums'] },
  inputRow: {
    paddingVertical: 11, paddingHorizontal: 14, borderTopWidth: 1,
    borderTopColor: '#ece5db', backgroundColor: '#fff',
    flexDirection: 'row', gap: 9, alignItems: 'center',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ece5db', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    backgroundColor: '#faf7f2', color: '#2a211b',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#d96b2b',
    alignItems: 'center', justifyContent: 'center',
  },
});
