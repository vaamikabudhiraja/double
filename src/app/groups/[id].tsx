import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, Palette, Section } from '@/constants/theme';
import { GroupChat } from '@/features/chat/group-chat';
import { getGroup, isMember, joinGroup } from '@/features/groups/api';
import type { Group } from '@/features/groups/types';
import { useAuth } from '@/providers/auth';

const EMERALD = Section.groups.color;

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id ?? '';
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [member, setMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const g = await getGroup(groupId);
      setGroup(g);
      setMember(user ? await isMember(groupId, user.id) : false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open this group.');
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const userName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'You';

  async function join() {
    if (!user) return;
    setJoining(true);
    try {
      await joinGroup(groupId, user.id);
      setMember(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {group?.name ?? 'Group'}
            </Text>
            {group ? (
              <Text style={styles.sub}>{group.member_count} in</Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={EMERALD} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
        </View>
      ) : !group ? (
        <View style={styles.center}>
          <Text style={styles.message}>This group no longer exists.</Text>
        </View>
      ) : !user ? (
        <View style={styles.center}>
          <Text style={styles.message}>
            Sign in from the You tab to see this group's chat.
          </Text>
        </View>
      ) : !member ? (
        <View style={styles.center}>
          <Text style={styles.gateTitle}>Join to see the chat</Text>
          <Text style={styles.message}>
            {group.join_policy === 'students'
              ? 'This group is students only — verification is coming soon.'
              : 'Group chats are members-only. Join to say hello and see the plan.'}
          </Text>
          {group.join_policy === 'open' ? (
            <Pressable
              onPress={join}
              disabled={joining}
              style={({ pressed }) => [styles.join, pressed && styles.pressed]}>
              {joining ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.joinText}>Join group</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : (
        <GroupChat groupId={groupId} userId={user.id} userName={userName} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  headerSafe: { backgroundColor: EMERALD },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  back: { color: '#FFFFFF', fontSize: 30, lineHeight: 30, marginTop: -4 },
  headerText: { flex: 1 },
  title: {
    fontFamily: FontFamily.display,
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: FontFamily.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  gateTitle: {
    fontFamily: FontFamily.display,
    color: Palette.ink,
    fontSize: 18,
  },
  message: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  join: {
    backgroundColor: EMERALD,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: 6,
  },
  pressed: { opacity: 0.85 },
  joinText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
