import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Section } from '@/constants/theme';
import { joinGroup, leaveGroup } from './api';
import { categoryEmoji, categoryLabel, type GroupWithMembership } from './types';

const EMERALD = Section.groups.color;

type Props = {
  group: GroupWithMembership;
  userId: string | undefined;
  onChanged: () => void;
  onNeedsAccount: () => void;
};

export function GroupRow({ group, userId, onChanged, onNeedsAccount }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStudentsOnly = group.join_policy === 'students';

  async function toggle() {
    if (!userId) {
      onNeedsAccount();
      return;
    }
    // Student verification isn't built yet — don't let people into gated groups.
    if (isStudentsOnly && !group.isMember) {
      setError('Student verification is coming soon.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (group.isMember) {
        await leaveGroup(group.id, userId);
      } else {
        await joinGroup(group.id, userId);
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Text style={styles.iconEmoji}>{categoryEmoji(group.category)}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {categoryLabel(group.category)} · {group.member_count} in
            {isStudentsOnly ? ' · students only' : ''}
          </Text>
        </View>

        {group.isHost ? (
          <View style={[styles.pill, styles.hostPill]}>
            <Text style={[styles.pillText, styles.hostPillText]}>Hosting</Text>
          </View>
        ) : (
          <Pressable
            onPress={toggle}
            disabled={busy}
            style={({ pressed }) => [
              styles.action,
              group.isMember ? styles.leave : styles.join,
              pressed && styles.pressed,
            ]}>
            {busy ? (
              <ActivityIndicator
                size="small"
                color={group.isMember ? Palette.inkSoft : '#FFFFFF'}
              />
            ) : (
              <Text
                style={[
                  styles.actionText,
                  group.isMember ? styles.leaveText : styles.joinText,
                ]}>
                {group.isMember ? 'Leave' : isStudentsOnly ? 'Verify' : 'Join'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    paddingVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Section.groups.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 19 },
  body: { flex: 1 },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 14.5,
  },
  meta: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
  action: {
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  join: { backgroundColor: EMERALD },
  leave: { borderWidth: 1.5, borderColor: Palette.line },
  pressed: { opacity: 0.85 },
  actionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13 },
  joinText: { color: '#FFFFFF' },
  leaveText: { color: Palette.inkSoft },
  pill: {
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  hostPill: { backgroundColor: Section.groups.tint },
  pillText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11 },
  hostPillText: { color: '#0b6b4f' },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.coral,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 52,
  },
});
