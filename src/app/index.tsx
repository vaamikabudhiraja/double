import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { TandemScreen } from '@/components/tandem-screen';
import { FontFamily, Palette, Section } from '@/constants/theme';
import { GigCard } from '@/features/gigs/gig-card';
import { useGigs } from '@/features/gigs/use-gigs';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function TonightScreen() {
  return (
    <TandemScreen section="tonight" kicker="Gigs in Dublin">
      <TonightFeed />
    </TandemScreen>
  );
}

function TonightFeed() {
  const { gigs, loading, refreshing, error, reload } = useGigs();

  if (!isSupabaseConfigured) {
    return (
      <Message text="Connect Supabase (.env.local) to load the gig feed." />
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Section.tonight.color} />
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Message text={error} />
        <Pressable
          onPress={reload}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={gigs}
      keyExtractor={(g) => g.id}
      renderItem={({ item, index }) => (
        <GigCard gig={item} highlighted={index === 0} />
      )}
      style={styles.flatList}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={reload}
          tintColor={Section.tonight.color}
        />
      }
      ListEmptyComponent={
        <Message text="No Dublin gigs listed right now. Pull to refresh." />
      }
    />
  );
}

function Message({ text }: { text: string }) {
  return <Text style={styles.message}>{text}</Text>;
}

const styles = StyleSheet.create({
  flatList: { flex: 1 },
  list: { paddingBottom: 24 },
  center: { paddingTop: 24, alignItems: 'center' },
  message: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  retry: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  pressed: { opacity: 0.85 },
  retryText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Section.tonight.color,
    fontSize: 14,
  },
});
