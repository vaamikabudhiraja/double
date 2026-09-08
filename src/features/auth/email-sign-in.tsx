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

const BLUE = Section.you.color;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Passwordless email sign-in using a 6-digit one-time code (no magic links, so
 * it works cleanly inside Expo Go with no deep-link setup). On success the
 * AuthProvider picks up the new session and this form is swapped out by the You
 * screen.
 */
export function EmailSignIn() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function sendCode() {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: err } = await getSupabase().auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail(clean);
    setNotice(`We emailed a 6-digit code to ${clean}.`);
    setCode('');
    setStep('code');
  }

  async function verifyCode() {
    const token = code.trim();
    if (token.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: err } = await getSupabase().auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    // Success: onAuthStateChange in AuthProvider updates the session.
  }

  return (
    <View style={styles.container}>
      <Text style={styles.lead}>
        Sign in to join groups, host, and message people from your groups. Browsing
        is open — you only need this when you want to take part.
      </Text>

      {step === 'email' ? (
        <>
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
            onSubmitEditing={sendCode}
            returnKeyType="send"
          />
          <PrimaryButton label="Email me a code" busy={busy} onPress={sendCode} />
        </>
      ) : (
        <>
          <Text style={styles.label}>6-digit code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor={Palette.inkSoft}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={6}
            editable={!busy}
            onSubmitEditing={verifyCode}
            returnKeyType="done"
          />
          <PrimaryButton label="Verify & sign in" busy={busy} onPress={verifyCode} />
          <Pressable
            onPress={() => {
              setStep('email');
              setError(null);
              setNotice(null);
            }}
            disabled={busy}
            style={styles.secondary}>
            <Text style={styles.secondaryText}>Use a different email</Text>
          </Pressable>
        </>
      )}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function PrimaryButton({
  label,
  busy,
  onPress,
}: {
  label: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.button,
        (busy || pressed) && styles.buttonPressed,
      ]}>
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  lead: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 13,
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
  codeInput: {
    letterSpacing: 6,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 18,
  },
  button: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
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
    color: Palette.inkSoft,
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
