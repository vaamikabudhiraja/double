import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamily, Palette, Section } from '@/constants/theme';
import { getSupabase } from '@/lib/supabase';
import { signInWithGoogle } from './oauth';

const BLUE = Section.you.color;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

type Mode = 'signin' | 'signup';

/**
 * Email + password sign-in. Chosen because Supabase's free tier locks the email
 * templates behind custom SMTP, so passwordless codes-by-email aren't available
 * yet — and password auth needs no email round-trip, so it works cleanly in
 * Expo Go. On success the AuthProvider picks up the session and the You screen
 * swaps to the signed-in panel.
 */
export function EmailSignIn() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setGoogleBusy(true);
    try {
      const result = await signInWithGoogle();
      // On success the AuthProvider swaps this screen out; a cancel is a no-op.
      if (!result.ok && !result.cancelled) {
        setError('Google sign-in did not complete.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setGoogleBusy(false);
    }
  }

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setError(null);
    setNotice(null);
    setBusy(true);
    const auth = getSupabase().auth;

    if (mode === 'signup') {
      const { data, error: err } = await auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { display_name: name.trim() || undefined } },
      });
      setBusy(false);
      if (err) {
        setError(err.message);
        return;
      }
      // With "Confirm email" off, a session is returned immediately. If it's on,
      // there's no session until the user confirms — tell them what to do.
      if (!data.session) {
        setNotice(
          'Account created. Email confirmation is on for this project — either ' +
            'confirm via the email, or turn off "Confirm email" in Supabase, then sign in.',
        );
        setMode('signin');
      }
      return;
    }

    const { error: err } = await auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setBusy(false);
    if (err) {
      setError(
        /email not confirmed/i.test(err.message)
          ? 'This email needs confirming. Turn off "Confirm email" in Supabase (Authentication → Sign In / Providers → Email), then try again.'
          : err.message,
      );
    }
  }

  const isSignup = mode === 'signup';

  return (
    <View style={styles.container}>
      <Text style={styles.lead}>
        Sign in to join groups, host, and message people from your groups. Browsing
        is open — you only need this to take part.
      </Text>

      <Pressable
        onPress={handleGoogle}
        disabled={busy || googleBusy}
        style={({ pressed }) => [
          styles.google,
          (busy || googleBusy || pressed) && styles.googlePressed,
        ]}>
        {googleBusy ? (
          <ActivityIndicator color={Palette.ink} />
        ) : (
          <>
            <FontAwesome name="google" size={17} color={Palette.ink} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </>
        )}
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or use email</Text>
        <View style={styles.dividerLine} />
      </View>

      {isSignup ? (
        <>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Aoife"
            placeholderTextColor={Palette.inkSoft}
            autoCapitalize="words"
            editable={!busy}
          />
        </>
      ) : null}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={Palette.inkSoft}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        inputMode="email"
        editable={!busy}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        placeholderTextColor={Palette.inkSoft}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={isSignup ? 'new-password' : 'current-password'}
        editable={!busy}
        onSubmitEditing={submit}
        returnKeyType="go"
      />

      <Pressable
        onPress={submit}
        disabled={busy}
        style={({ pressed }) => [
          styles.button,
          (busy || pressed) && styles.buttonPressed,
        ]}>
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isSignup ? 'Create account' : 'Sign in'}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setMode(isSignup ? 'signin' : 'signup');
          setError(null);
          setNotice(null);
        }}
        disabled={busy}
        style={styles.secondary}>
        <Text style={styles.secondaryText}>
          {isSignup
            ? 'Already have an account? Sign in'
            : "New here? Create an account"}
        </Text>
      </Pressable>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  lead: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 50,
    backgroundColor: Palette.card,
  },
  googlePressed: { opacity: 0.85 },
  googleText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Palette.line },
  dividerText: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 12,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Palette.ink,
    backgroundColor: Palette.card,
  },
  button: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 50,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: {
    fontFamily: FontFamily.bodyMedium,
    color: BLUE,
    fontSize: 13,
  },
  notice: {
    fontFamily: FontFamily.body,
    color: Palette.ink,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.coral,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
});
