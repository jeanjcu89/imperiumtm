import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initials } from '@imperium/shared';
import { useAuth } from '../state/AuthContext.js';

// Shared phone header: date line + heading + initials avatar (storyboard
// PhoneShell chrome). Long-press the avatar to sign out.
export default function Header({ heading, onBack }) {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
            <Text style={styles.backTxt}>{'‹'}</Text>
          </Pressable>
        ) : null}
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.heading} numberOfLines={1}>{heading}</Text>
        </View>
      </View>
      <Pressable onLongPress={signOut} style={styles.avatar}>
        <Text style={styles.avatarTxt}>{initials(profile?.fullName ?? '')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#ece5db',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  back: {
    width: 32, height: 32, borderRadius: 16, marginRight: 8,
    backgroundColor: '#faf7f2', borderWidth: 1, borderColor: '#ece5db',
    alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { fontSize: 20, fontWeight: '700', color: '#3a2c20', marginTop: -2 },
  date: { fontSize: 11, color: '#a1927f', fontWeight: '600' },
  heading: { fontWeight: '800', fontSize: 19, lineHeight: 22, marginTop: 2, color: '#2a211b' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3e2d2',
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  avatarTxt: { fontWeight: '700', color: '#b85618', fontSize: 14 },
});
