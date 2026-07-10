import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './state/AuthContext.js';
import { DataProvider } from './state/DataContext.js';
import SignInScreen from './screens/SignInScreen.js';
import HomeScreen from './screens/HomeScreen.js';
import JobDetailScreen from './screens/JobDetailScreen.js';
import IssuesScreen from './screens/IssuesScreen.js';
import ChatScreen from './screens/ChatScreen.js';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TABS = [
  { key: 'jobs', label: 'Jobs' },
  { key: 'issues', label: 'Issues' },
  { key: 'chat', label: 'Chat' },
];

// Storyboard phone tab bar: white, top border, 9px dot + 10.5px label.
function TabBar({ tab, onSelect }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {TABS.map(t => {
        const active = t.key === tab;
        return (
          <Pressable key={t.key} onPress={() => onSelect(t.key)} style={styles.tabItem}>
            <View style={[styles.tabDot, { backgroundColor: active ? '#d96b2b' : '#d8c5ad' }]} />
            <Text style={{
              fontSize: 10.5, fontWeight: active ? '700' : '500',
              color: active ? '#d96b2b' : '#a1927f',
            }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Shell() {
  const [tab, setTab] = useState('jobs');

  const selectTab = (key) => {
    setTab(key);
    // Leaving a pushed JobDetail: pop back to the tab container.
    if (navRef.isReady() && navRef.canGoBack()) navRef.dispatch(StackActions.popToTop());
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#faf7f2' }}>
      <NavigationContainer ref={navRef}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#faf7f2' } }}>
          <Stack.Screen name="Home">
            {(props) => tab === 'issues'
              ? <IssuesScreen />
              : tab === 'chat'
                ? <ChatScreen />
                : <HomeScreen {...props} />}
          </Stack.Screen>
          <Stack.Screen name="JobDetail" component={JobDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <TabBar tab={tab} onSelect={selectTab} />
    </View>
  );
}

function Center({ children }) {
  return <View style={styles.center}>{children}</View>;
}

function Gate() {
  const { configured, loading, session, profile } = useAuth();

  if (!configured) {
    return (
      <Center>
        <Text style={styles.noticeTitle}>Imperium Field</Text>
        <Text style={styles.noticeBody}>
          Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and{' '}
          EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/field/.env, then restart Expo.
        </Text>
      </Center>
    );
  }

  if (loading) {
    return <Center><ActivityIndicator size="large" color="#d96b2b" /></Center>;
  }

  if (!session || !profile) return <SignInScreen />;

  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, backgroundColor: '#efe9e0',
  },
  noticeTitle: { fontWeight: '800', fontSize: 20, color: '#2a211b', marginBottom: 8 },
  noticeBody: {
    maxWidth: 380, textAlign: 'center', color: '#8a7d70',
    fontSize: 14, lineHeight: 22,
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#ece5db',
    paddingTop: 8, paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  tabDot: { width: 9, height: 9, borderRadius: 5 },
});
