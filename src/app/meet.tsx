import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TandemScreen } from '@/components/tandem-screen';
import { FontFamily, Palette, Section } from '@/constants/theme';
import { searchUsers } from '@/features/meet/api';
import type { Pair, UserResult } from '@/features/meet/types';
import { usePairs } from '@/features/meet/use-pairs';
import { useAuth } from '@/providers/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

const VIOLET = Section.meet.color;

export default function MeetScreen() {
  const { user } = useAuth();
  const userId = user?.id;
  const { groups, relatedIds, loading, error, ask, accept, remove } = usePairs(userId);

  if (!isSupabaseConfigured) {
    return (
      <TandemScreen
        section="meet"
        kicker="Not alone"
        blurb="Connect Supabase (.env.local) to line up your +1."
      />
    );
  }

  return (
    <TandemScreen section="meet" kicker="Not alone">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {!userId ? (
          <Text style={styles.message}>
            Sign in from the You tab to line up your +1.
          </Text>
        ) : loading ? (
          <ActivityIndicator color={VIOLET} style={styles.loading} />
        ) : (
          <>
            <Text style={styles.intro}>
              Doubles start with your own pair. Lock in your +1 first — then (soon)
              you'll get matched with other pairs, and both sides agree before
              anyone talks. Never swiping.
            </Text>

            {groups.confirmed.length > 0 ? (
              <Panel title="Your +1">
                {groups.confirmed.map((p) => (
                  <PairRow
                    key={p.id}
                    pair={p}
                    subtitle="Confirmed"
                    actionLabel="Unpair"
                    onAction={() => remove(p.id)}
                    highlight
                  />
                ))}
              </Panel>
            ) : null}

            {groups.incoming.length > 0 ? (
              <Panel title="Wants you as their +1">
                {groups.incoming.map((p) => (
                  <PairRow
                    key={p.id}
                    pair={p}
                    subtitle="Asked to pair with you"
                    actionLabel="Accept"
                    onAction={() => accept(p.id)}
                    secondaryLabel="Decline"
                    onSecondary={() => remove(p.id)}
                  />
                ))}
              </Panel>
            ) : null}

            {groups.outgoing.length > 0 ? (
              <Panel title="Waiting to hear back">
                {groups.outgoing.map((p) => (
                  <PairRow
                    key={p.id}
                    pair={p}
                    subtitle="Pending"
                    actionLabel="Cancel"
                    onAction={() => remove(p.id)}
                  />
                ))}
              </Panel>
            ) : null}

            <Panel title="Find your +1">
              <UserSearch
                excludeIds={relatedIds}
                selfId={userId}
                onAsk={ask}
              />
            </Panel>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        )}
      </ScrollView>
    </TandemScreen>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PairRow({
  pair,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  highlight,
}: {
  pair: Pair;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  highlight?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const run = (fn: () => void) => async () => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={[styles.row, highlight && styles.rowHighlight]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {pair.otherName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.name}>{pair.otherName}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      {secondaryLabel && onSecondary ? (
        <Pressable onPress={run(onSecondary)} disabled={busy} style={styles.ghost}>
          <Text style={styles.ghostText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={run(onAction)}
        disabled={busy}
        style={[styles.action, highlight && styles.actionGhost]}>
        {busy ? (
          <ActivityIndicator size="small" color={highlight ? Palette.inkSoft : '#FFFFFF'} />
        ) : (
          <Text style={[styles.actionText, highlight && styles.actionGhostText]}>
            {actionLabel}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function UserSearch({
  excludeIds,
  selfId,
  onAsk,
}: {
  excludeIds: Set<string>;
  selfId: string;
  onAsk: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [askingId, setAskingId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const found = await searchUsers(query, selfId);
        setResults(found.filter((u) => !excludeIds.has(u.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, selfId, excludeIds]);

  async function handleAsk(id: string) {
    setAskingId(id);
    try {
      await onAsk(id);
      setQuery('');
      setResults([]);
    } finally {
      setAskingId(null);
    }
  }

  return (
    <View>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name…"
        placeholderTextColor={Palette.inkSoft}
        autoCapitalize="words"
        autoCorrect={false}
      />
      {searching ? (
        <ActivityIndicator color={VIOLET} style={styles.searching} />
      ) : null}
      {results.map((u) => (
        <View key={u.id} style={styles.result}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{u.name}</Text>
          <Pressable
            onPress={() => handleAsk(u.id)}
            disabled={askingId === u.id}
            style={styles.action}>
            {askingId === u.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionText}>Ask</Text>
            )}
          </Pressable>
        </View>
      ))}
      {query.trim().length >= 2 && !searching && results.length === 0 ? (
        <Text style={styles.hint}>
          No one found. They need a Tandem account with that name.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  loading: { marginTop: 24 },
  message: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  intro: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 13,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 8,
  },
  rowHighlight: {
    backgroundColor: Section.meet.tint,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  result: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  rowBody: { flex: 1 },
  name: { fontFamily: FontFamily.bodySemiBold, color: Palette.ink, fontSize: 14, flex: 1 },
  sub: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12,
    marginTop: 1,
  },
  action: {
    backgroundColor: VIOLET,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 64,
    alignItems: 'center',
  },
  actionGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Palette.line },
  actionText: { fontFamily: FontFamily.bodySemiBold, color: '#FFFFFF', fontSize: 13 },
  actionGhostText: { color: Palette.inkSoft },
  ghost: { paddingVertical: 8, paddingHorizontal: 12 },
  ghostText: { fontFamily: FontFamily.bodyMedium, color: Palette.inkSoft, fontSize: 13 },
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
  searching: { marginTop: 10, alignSelf: 'flex-start' },
  hint: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12.5,
    marginTop: 10,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.coral,
    fontSize: 13,
    marginTop: 16,
  },
});
