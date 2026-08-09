import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials are missing. Running with local fallback data; admin features are unavailable.');
}

// Keep a valid client for shared service types, but prevent callers from using
// it when the app is intentionally running without Supabase configuration.
export const supabase = createClient(
  supabaseUrl || 'https://offline.invalid',
  supabaseAnonKey || 'offline-anon-key',
);
