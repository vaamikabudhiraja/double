// URL polyfill must load before the Supabase client is created (RN has no
// global URL by default).
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from './database.types';

// The app only ever holds the public URL + anon key (CLAUDE.md). Both are safe
// to ship in the client bundle; real access is enforced by Row-Level Security in
// the database. Everything privileged lives in Supabase Edge Functions.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True once both env vars are present. Consumers should degrade gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The typed client, or `null` until env is configured. It's intentionally
 * nullable so the app still runs before a Supabase project exists — the tab
 * shell must not crash just because auth isn't wired up yet.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // No URL-based session handoff on native.
        detectSessionInUrl: false,
      },
    })
  : null;

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set.\n' +
      'Copy .env.example to .env.local and fill them in, then restart with `npx expo start -c`.\n' +
      'Auth and data are disabled until then; the rest of the app still works.',
  );
}

// Keep the auth token refreshing only while the app is in the foreground.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

/**
 * Returns the client, throwing if Supabase isn't configured. Use this inside
 * data-access functions where a client is required — it turns a missing setup
 * into a clear error instead of a null-deref.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local.',
    );
  }
  return supabase;
}
