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

/** Trim whitespace and any accidental surrounding quotes from an env value. */
function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '').trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const url = cleanEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
const anonKey = cleanEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

/**
 * The typed client, or `null` until env is configured AND valid. It's
 * intentionally nullable — and initialisation never throws — so a missing or
 * mistyped .env.local degrades to "auth disabled" instead of crashing the whole
 * app. The tab shell must survive a backend that isn't set up yet.
 */
function initSupabase(): SupabaseClient<Database> | null {
  // Nothing configured yet — expected before the user creates a project.
  if (!url || !anonKey) {
    if (__DEV__) {
      console.warn(
        '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set.\n' +
          'Copy .env.example to .env.local, fill both in, then restart with `npx expo start -c`.\n' +
          'Auth and data are disabled until then; the rest of the app still works.',
      );
    }
    return null;
  }

  // Configured but the URL is malformed — the common .env.local typo.
  if (!isHttpUrl(url)) {
    console.warn(
      `[supabase] EXPO_PUBLIC_SUPABASE_URL is not a valid URL: "${url}".\n` +
        'It must start with https:// and look like https://<your-project-ref>.supabase.co\n' +
        'Fix it in .env.local and restart with `npx expo start -c`.',
    );
    return null;
  }

  // Normalise to just the origin (scheme + host). Supabase's own URLs carry no
  // path, and pasting one with a trailing path like `/rest/v1` would send auth
  // calls to `/rest/v1/auth/v1/...` and fail with "No API key found in request".
  const baseUrl = new URL(url).origin;
  if (__DEV__ && baseUrl !== url.replace(/\/+$/, '')) {
    console.warn(
      `[supabase] Trimmed EXPO_PUBLIC_SUPABASE_URL to its origin: ${baseUrl}\n` +
        'Set it to just https://<your-project-ref>.supabase.co (no trailing path).',
    );
  }

  try {
    return createClient<Database>(baseUrl, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // No URL-based session handoff on native.
        detectSessionInUrl: false,
        // PKCE is the secure OAuth flow for mobile (Google sign-in via browser).
        flowType: 'pkce',
      },
    });
  } catch (error) {
    console.warn(
      '[supabase] Failed to initialise the client — check your .env.local values.',
      error,
    );
    return null;
  }
}

export const supabase = initSupabase();

/** True once a usable client exists (env present, valid, and initialised). */
export const isSupabaseConfigured = supabase !== null;

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
      'Supabase is not configured. Set valid EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY values in .env.local.',
    );
  }
  return supabase;
}
