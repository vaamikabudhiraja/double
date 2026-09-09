import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatThread } from '@/features/chat/chat-thread';
import { FontFamily, Palette, Section } from '@/constants/theme';
import type { Gig } from '@/features/gigs/types';
import { useMessageActions } from '@/features/safety/use-message-actions';
import { useEventChat } from './use-event-chat';
import { useEventRoom } from './use-event-room';

const CORAL = Section.tonight.color;

function formatWhen(startsAt: string | null): string | null {
  if (!startsAt) return null;
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return null;
  return d
    .toLocaleString('en-IE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/,/g, ' ·');
}

type Props = {
  gig: Gig;
  userId: string | undefined;
  userName: string;
  onClose: () => void;
};

export function EventRoom({ gig, userId, userName, onClose }: Props) {
  const {
    room,
    attending,
    pint,
    names,
    loading,
    busy,
    error,
    join,
    leave,
    togglePint,
  } = useEventRoom(gig, userId);

  const going = room?.goingCount ?? 0;
  const when = formatWhen(gig.startsAt);
  const subtitle = [gig.venue, when].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {gig.name}
            </Text>
            {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            <Text style={styles.going}>
              {going} going{attending ? ' · you' : ''}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={CORAL} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
        </View>
      ) : !userId ? (
        <View style={styles.center}>
          <Text style={styles.message}>
            Sign in from the You tab to join this room.
          </Text>
        </View>
      ) : !attending ? (
        <View style={styles.center}>
          <Text style={styles.gateTitle}>Going to this?</Text>
          <Text style={styles.message}>
            Say you're going to see who else is and chat before the show — the room
            closes after the night.
          </Text>
          <Pressable
            onPress={join}
            disabled={busy}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>I'm going</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.flex}>
          <View style={styles.pintRow}>
            <View style={styles.flexShrink}>
              <Text style={styles.pintTitle}>🍺 Pre-gig pint</Text>
              <Text style={styles.pintSub}>Meet nearby before doors.</Text>
            </View>
            <Switch
              value={pint}
              onValueChange={togglePint}
              trackColor={{ true: CORAL, false: Palette.line }}
            />
          </View>

          {names.length > 0 ? (
            <View style={styles.people}>
              {names.slice(0, 8).map((n, i) => (
                <View key={`${n}-${i}`} style={styles.chip}>
                  <Text style={styles.chipText}>{n}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.chatWrap}>
            {room ? (
              <EventChat
                eventId={room.id}
                userId={userId}
                userName={userName}
              />
            ) : null}
          </View>

          <Pressable onPress={leave} disabled={busy} style={styles.leave}>
            <Text style={styles.leaveText}>Leave room</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function EventChat({
  eventId,
  userId,
  userName,
}: {
  eventId: string;
  userId: string;
  userName: string;
}) {
  const { messages, loading, error, send } = useEventChat(eventId, userId, userName);
  const { blockedIds, onLongPressMessage } = useMessageActions(
    userId,
    `event:${eventId}`,
  );
  return (
    <ChatThread
      messages={messages}
      loading={loading}
      error={error}
      currentUserId={userId}
      accent={CORAL}
      onSend={send}
      systemNote="This room closes after the show"
      blockedIds={blockedIds}
      onLongPressMessage={onLongPressMessage}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  flex: { flex: 1 },
  flexShrink: { flex: 1 },
  headerSafe: { backgroundColor: CORAL },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: FontFamily.display,
    color: '#FFFFFF',
    fontSize: 21,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: FontFamily.bodyMedium,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12.5,
    marginTop: 2,
  },
  going: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'flex-start',
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
    overflow: 'hidden',
  },
  close: { padding: 2 },
  closeText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  gateTitle: { fontFamily: FontFamily.display, color: Palette.ink, fontSize: 19 },
  message: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: CORAL,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 30,
    marginTop: 6,
  },
  pressed: { opacity: 0.85 },
  ctaText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  pintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: Palette.yellowTint,
    borderRadius: 15,
    padding: 13,
  },
  pintTitle: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 14,
  },
  pintSub: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
  people: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  chip: {
    backgroundColor: Palette.coralTint,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#b53228',
    fontSize: 11.5,
  },
  chatWrap: { flex: 1, marginTop: 8 },
  leave: { paddingVertical: 12, alignItems: 'center' },
  leaveText: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 13,
  },
});
