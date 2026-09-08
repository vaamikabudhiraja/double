import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TandemScreen } from '@/components/tandem-screen';
import { FontFamily, Palette, Section } from '@/constants/theme';
import { EmailSignIn } from '@/features/auth/email-sign-in';
import { useAuth } from '@/providers/auth';

export default function YouScreen() {
  const { configured, session, user, loading, signOut } = useAuth();

  // Backend not set up yet — guide setup instead of showing a broken form.
  if (!configured) {
    return (
      <TandemScreen
        section="you"
        kicker="Your profile & badges"
        blurb="Sign-in switches on once Supabase is connected: copy .env.example to .env.local, add your project URL + anon key, then restart with `npx expo start -c`."
      />
    );
  }

  return (
    <TandemScreen
      section="you"
      kicker={session ? 'Signed in' : 'Sign in to Tandem'}>
      {loading ? null : session ? (
        <View>
          <Text style={styles.label}>You're signed in as</Text>
          <Text style={styles.email}>{user?.email ?? 'your account'}</Text>
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
          <Text style={styles.hint}>
            Your profile, the badges you carry per group, and your reliability land
            here next.
          </Text>
        </View>
      ) : (
        <EmailSignIn />
      )}
    </TandemScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 13,
  },
  email: {
    fontFamily: FontFamily.displayBold,
    color: Palette.ink,
    fontSize: 20,
    marginTop: 4,
  },
  signOut: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  pressed: { opacity: 0.85 },
  signOutText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Section.you.color,
    fontSize: 15,
  },
  hint: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 22,
  },
});
