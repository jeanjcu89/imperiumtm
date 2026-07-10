import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Null when credentials aren't configured — the app then runs on
// built-in demo data with no persistence (see src/state.jsx).
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
