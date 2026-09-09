import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamily, Palette, Section } from '@/constants/theme';
import { createGroup } from './api';
import { CATEGORIES, type JoinPolicy } from './types';

const EMERALD = Section.groups.color;
const BLUE = Section.you.color;

type Props = {
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
};

export function CreateGroup({ userId, onCreated, onCancel }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0].key);
  const [description, setDescription] = useState('');
  const [joinPolicy, setJoinPolicy] = useState<JoinPolicy>('open');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError('Give your group a name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createGroup(userId, {
        name: name.trim(),
        category,
        description: description.trim() || null,
        join_policy: joinPolicy,
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the group.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name it</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Howth & Wicklow hikes"
        placeholderTextColor={Palette.inkSoft}
        editable={!busy}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => {
          const on = c.key === category;
          return (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              disabled={busy}
              style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {c.emoji} {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>One line</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Easy Sunday hikes, coffee after. All paces welcome."
        placeholderTextColor={Palette.inkSoft}
        multiline
        editable={!busy}
      />

      <Text style={styles.label}>Who can join</Text>
      <View style={styles.who}>
        <WhoOption
          title="Everyone"
          sub="Open — no verification"
          selected={joinPolicy === 'open'}
          onPress={() => setJoinPolicy('open')}
          color={EMERALD}
        />
        <WhoOption
          title="Students only"
          sub="UCD / Trinity / TU Dublin · needs verify"
          selected={joinPolicy === 'students'}
          onPress={() => setJoinPolicy('students')}
          color={BLUE}
        />
      </View>

      <Pressable
        onPress={submit}
        disabled={busy}
        style={({ pressed }) => [styles.create, (busy || pressed) && styles.pressed]}>
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.createText}>Create group</Text>
        )}
      </Pressable>
      <Pressable onPress={onCancel} disabled={busy} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

function WhoOption({
  title,
  sub,
  selected,
  onPress,
  color,
}: {
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.whoOption, selected && { borderColor: color }]}>
      <View style={styles.whoText}>
        <Text style={styles.whoTitle}>{title}</Text>
        <Text style={styles.whoSub}>{sub}</Text>
      </View>
      <View style={[styles.radio, selected && { borderColor: color }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: color }]} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
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
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  chipOn: { borderColor: EMERALD, backgroundColor: Section.groups.tint },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.inkSoft,
    fontSize: 13,
  },
  chipTextOn: { color: '#0b6b4f' },
  who: { gap: 8 },
  whoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 12,
    padding: 13,
    gap: 10,
  },
  whoText: { flex: 1 },
  whoTitle: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 14,
  },
  whoSub: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  create: {
    backgroundColor: EMERALD,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 50,
  },
  pressed: { opacity: 0.85 },
  createText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  cancel: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelText: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 13,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.coral,
    fontSize: 13,
    marginTop: 12,
  },
});
