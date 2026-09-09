import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TandemScreen } from '@/components/tandem-screen';
import { FontFamily, Palette, Section } from '@/constants/theme';
import { CreateGroup } from '@/features/groups/create-group';
import { GroupRow } from '@/features/groups/group-row';
import { useGroups } from '@/features/groups/use-groups';
import { useAuth } from '@/providers/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

const EMERALD = Section.groups.color;

export default function GroupsScreen() {
  const { user } = useAuth();
  const userId = user?.id;
  const { groups, loading, refreshing, error, reload } = useGroups(userId);
  const [creating, setCreating] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <TandemScreen
        section="groups"
        kicker="Browse & join"
        blurb="Connect Supabase (.env.local) to load groups."
      />
    );
  }

  if (creating && userId) {
    return (
      <TandemScreen section="groups" kicker="Start a group">
        <CreateGroup
          userId={userId}
          onCreated={() => {
            setCreating(false);
            reload();
          }}
          onCancel={() => setCreating(false)}
        />
      </TandemScreen>
    );
  }

  return (
    <TandemScreen section="groups" kicker="Browse & join">
      <View style={styles.headerRow}>
        <Text style={styles.count}>
          {loading ? '' : `${groups.length} group${groups.length === 1 ? '' : 's'}`}
        </Text>
        <Pressable
          onPress={() => (userId ? setCreating(true) : reload())}
          disabled={!userId}
          style={({ pressed }) => [
            styles.add,
            !userId && styles.addDisabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.addText}>+ New group</Text>
        </Pressable>
      </View>

      {!userId ? (
        <Text style={styles.hint}>Sign in (You tab) to create or join groups.</Text>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={EMERALD} />
        </View>
      ) : error ? (
        <View>
          <Text style={styles.message}>{error}</Text>
          <Pressable onPress={reload} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={reload}
              tintColor={EMERALD}
            />
          }
          renderItem={({ item }) => (
            <GroupRow
              group={item}
              userId={userId}
              onChanged={reload}
              onNeedsAccount={reload}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.message}>
              No groups yet. Tap “+ New group” to start the first one.
            </Text>
          }
        />
      )}
    </TandemScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  count: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 13,
  },
  add: {
    backgroundColor: EMERALD,
    borderRadius: 100,
    paddingVertical: 9,
    paddingHorizontal: 15,
  },
  addDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  addText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  hint: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12.5,
    marginTop: 8,
  },
  list: { flex: 1, marginTop: 8 },
  listContent: { paddingBottom: 24 },
  center: { paddingTop: 24, alignItems: 'center' },
  message: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  retry: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  retryText: {
    fontFamily: FontFamily.bodySemiBold,
    color: EMERALD,
    fontSize: 14,
  },
});
