import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamily, Palette, Section } from '@/constants/theme';
import { updateMyProfile } from './api';
import { useMyProfile } from './use-profile';

const BLUE = Section.you.color;

type Props = {
  userId: string;
  email: string | null;
  onSignOut: () => void;
};

/** The signed-in You tab: view + edit your basic profile, then sign out. */
export function ProfilePanel({ userId, email, onSignOut }: Props) {
  const { profile, loading, error, reload } = useMyProfile(userId);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [newToDublin, setNewToDublin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? '');
      setBio(profile.bio ?? '');
      setNewToDublin(profile.new_to_dublin);
    }
  }, [profile]);

  async function save() {
    if (!name.trim()) {
      setSaveError('Add a name.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await updateMyProfile(userId, {
        display_name: name.trim(),
        bio: bio.trim() || null,
        new_to_dublin: newToDublin,
      });
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={reload} style={styles.secondary}>
          <Text style={styles.secondaryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.email}>{email ?? 'Signed in'}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(t) => {
          setName(t);
          setSaved(false);
        }}
        placeholder="Your name"
        placeholderTextColor={Palette.inkSoft}
        autoCapitalize="words"
        editable={!saving}
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.bio]}
        value={bio}
        onChangeText={(t) => {
          setBio(t);
          setSaved(false);
        }}
        placeholder="A line about you — what you're into."
        placeholderTextColor={Palette.inkSoft}
        multiline
        editable={!saving}
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchTitle}>New to Dublin</Text>
          <Text style={styles.switchSub}>Show others you've just arrived.</Text>
        </View>
        <Switch
          value={newToDublin}
          onValueChange={(v) => {
            setNewToDublin(v);
            setSaved(false);
          }}
          trackColor={{ true: BLUE, false: Palette.line }}
          disabled={saving}
        />
      </View>

      <Pressable
        onPress={save}
        disabled={saving}
        style={({ pressed }) => [
          styles.button,
          (saving || pressed) && styles.pressed,
        ]}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Save profile</Text>
        )}
      </Pressable>

      {saved ? <Text style={styles.saved}>Saved ✓</Text> : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      <Pressable
        onPress={onSignOut}
        style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingTop: 24, alignItems: 'center' },
  email: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 13,
    marginBottom: 6,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 13,
    marginTop: 14,
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
  bio: { minHeight: 72, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  switchText: { flex: 1 },
  switchTitle: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 14,
  },
  switchSub: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  pressed: { opacity: 0.85 },
  buttonText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  saved: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.emerald,
    fontSize: 13,
    marginTop: 12,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.coral,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  secondary: { paddingVertical: 12, alignItems: 'flex-start' },
  secondaryText: {
    fontFamily: FontFamily.bodySemiBold,
    color: BLUE,
    fontSize: 14,
  },
  signOut: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 24,
  },
  signOutText: {
    fontFamily: FontFamily.bodySemiBold,
    color: BLUE,
    fontSize: 15,
  },
});
