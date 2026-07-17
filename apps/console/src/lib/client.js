import { createImperiumClient } from '@imperium/shared';

export const client = createImperiumClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  // Lets password-recovery links sign in and trigger the reset screen.
  detectSessionInUrl: true,
});
