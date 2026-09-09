import { ScrollView, StyleSheet } from 'react-native';

import { TandemScreen } from '@/components/tandem-screen';
import { EmailSignIn } from '@/features/auth/email-sign-in';
import { ProfilePanel } from '@/features/profile/profile-panel';
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
      kicker={session ? 'Your profile' : 'Sign in to Tandem'}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {loading ? null : session && user ? (
          <ProfilePanel
            userId={user.id}
            email={user.email ?? null}
            onSignOut={signOut}
          />
        ) : (
          <EmailSignIn />
        )}
      </ScrollView>
    </TandemScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
});
