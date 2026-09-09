import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { getSupabase } from '@/lib/supabase';

// Lets the browser auth session close cleanly when it redirects back.
WebBrowser.maybeCompleteAuthSession();

/**
 * Where the OAuth provider sends the browser back to. In Expo Go this is an
 * `exp://.../--/auth/callback` URL; in a dev/production build it's
 * `double://auth/callback`. This exact string must be added to Supabase →
 * Authentication → URL Configuration → Redirect URLs.
 */
export const oauthRedirectTo = Linking.createURL('auth/callback');

if (__DEV__) {
  // Printed so you can copy the exact value into Supabase's allowed redirect URLs.
  console.log('[oauth] Supabase redirect URL to allow:', oauthRedirectTo);
}

export type OAuthResult = { ok: boolean; cancelled?: boolean };

/**
 * Browser-based Google sign-in that works in Expo Go: ask Supabase for the
 * provider URL, open it in an auth session, then exchange the returned code for
 * a session (PKCE). On success the AuthProvider picks up the new session.
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  const supabase = getSupabase();

  // No `skipBrowserRedirect`: that appends `skip_http_redirect=true`, which turns
  // the authorize URL into a JSON API call the Supabase gateway rejects for a
  // missing apikey. Without it, opening the URL 302-redirects straight to Google.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: oauthRedirectTo },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start Google sign-in.');

  // The gateway requires the anon key on the authorize request; add it if the
  // generated URL doesn't already carry it.
  let authUrl = data.url;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey && !/[?&]apikey=/.test(authUrl)) {
    authUrl += `${authUrl.includes('?') ? '&' : '?'}apikey=${encodeURIComponent(anonKey)}`;
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, oauthRedirectTo);
  if (result.type !== 'success') {
    return { ok: false, cancelled: true };
  }

  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
  if (!code) {
    const description =
      (typeof queryParams?.error_description === 'string' &&
        queryParams.error_description) ||
      (typeof queryParams?.error === 'string' && queryParams.error) ||
      'Google sign-in did not return an authorization code.';
    throw new Error(description);
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return { ok: true };
}
