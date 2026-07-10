// URL polyfill MUST load before supabase-js touches URL/URLSearchParams.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createImperiumClient } from '@imperium/shared';

export const client = createImperiumClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  storage: AsyncStorage,
});
