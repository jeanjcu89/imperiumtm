import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../state/AuthContext.js';

export default function SignInScreen() {
  const { signIn, signUpWithInvite } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('signin'); // 'signin' | 'invite'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const invite = mode === 'invite';

  const submit = async () => {
    if (busy) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      if (invite) {
        const { data, error: e } = await signUpWithInvite({
          email: email.trim(), password,
          fullName: fullName.trim(), inviteCode: inviteCode.trim(),
        });
        if (e) { setError(e.message); return; }
        // Email confirmation on: signUp returns a user but NO session.
        if (data?.user && !data?.session) {
          setMode('signin');
          setNotice('Check your email to confirm your account, then sign in.');
        }
      } else {
        const { error: e } = await signIn({ email: email.trim(), password });
        if (e) setError(e.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = email.trim() && password
    && (!invite || (fullName.trim() && inviteCode.trim()));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#efe9e0' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.page, {
          paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32,
        }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* brand */}
        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <View style={styles.brandDot}><Text style={styles.brandDotTxt}>IM</Text></View>
          <Text style={styles.brand}>Imperium</Text>
          <Text style={styles.brandSub}>Field crew app</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {invite ? 'Join your company' : 'Sign in'}
          </Text>
          <Text style={styles.cardSub}>
            {invite
              ? 'Enter the invite code your manager gave you.'
              : 'Use the account you created with your invite.'}
          </Text>

          {notice ? <View style={styles.notice}><Text style={styles.noticeTxt}>{notice}</Text></View> : null}
          {error ? <View style={styles.errBox}><Text style={styles.errTxt}>{error}</Text></View> : null}

          {invite ? (
            <>
              <TextInput
                style={styles.input} placeholder="Invite code" placeholderTextColor="#a1927f"
                value={inviteCode} onChangeText={setInviteCode}
                autoCapitalize="characters" autoCorrect={false}
              />
              <TextInput
                style={styles.input} placeholder="Your name" placeholderTextColor="#a1927f"
                value={fullName} onChangeText={setFullName} autoCorrect={false}
              />
            </>
          ) : null}
          <TextInput
            style={styles.input} placeholder="Email" placeholderTextColor="#a1927f"
            value={email} onChangeText={setEmail}
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
          />
          <TextInput
            style={styles.input} placeholder="Password" placeholderTextColor="#a1927f"
            value={password} onChangeText={setPassword} secureTextEntry
          />

          <Pressable
            onPress={submit} disabled={!canSubmit || busy}
            style={[styles.primaryBtn, (!canSubmit || busy) && { opacity: 0.55 }]}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnTxt}>{invite ? 'Create account' : 'Sign in'}</Text>}
          </Pressable>

          <Pressable
            onPress={() => { setMode(invite ? 'signin' : 'invite'); setError(''); setNotice(''); }}
            style={{ marginTop: 14, alignItems: 'center' }}
          >
            <Text style={styles.switchTxt}>
              {invite
                ? 'Already have an account? Sign in'
                : 'Have an invite code? Join your company'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 22, justifyContent: 'center' },
  brandDot: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: '#d96b2b',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  brandDotTxt: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  brand: { fontSize: 26, fontWeight: '800', color: '#3a2c20', letterSpacing: -0.5 },
  brandSub: { fontSize: 13, color: '#8a7d70', marginTop: 3, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece5db',
    borderRadius: 14, padding: 18,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#2a211b' },
  cardSub: { fontSize: 12.5, color: '#8a7d70', marginTop: 4, marginBottom: 14, lineHeight: 18 },
  notice: {
    backgroundColor: '#e2efe5', borderRadius: 10, padding: 11, marginBottom: 12,
  },
  noticeTxt: { color: '#4f8a5b', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  errBox: {
    backgroundColor: '#f9e5df', borderRadius: 10, padding: 11, marginBottom: 12,
  },
  errTxt: { color: '#b3402e', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  input: {
    borderWidth: 1, borderColor: '#ece5db', backgroundColor: '#faf7f2',
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12,
    fontSize: 14, color: '#2a211b', marginBottom: 10,
  },
  primaryBtn: {
    marginTop: 4, backgroundColor: '#d96b2b', borderRadius: 11,
    paddingVertical: 13, alignItems: 'center',
  },
  primaryBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  switchTxt: { color: '#b85618', fontSize: 13, fontWeight: '700' },
});
