import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette } from '@/constants/theme';
import type { Gig } from './types';

/** Formats an ISO date/datetime as e.g. "Fri 12 Sep · 8:00pm". */
function formatWhen(startsAt: string | null): string | null {
  if (!startsAt) return null;
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  // Only show a time if the source had one (a bare date parses to midnight).
  const hasTime = /T\d{2}:\d{2}/.test(startsAt);
  if (!hasTime) return day;

  const time = date
    .toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(' ', '')
    .toLowerCase();
  return `${day} · ${time}`;
}

export function GigCard({
  gig,
  highlighted,
  onOpen,
}: {
  gig: Gig;
  highlighted?: boolean;
  onOpen: () => void;
}) {
  const when = formatWhen(gig.startsAt);
  const subtitle = [gig.venue, when].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        highlighted && styles.hot,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.name} numberOfLines={2}>
        {gig.name}
      </Text>
      {subtitle ? <Text style={styles.meta}>{subtitle}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.cta}>Tap to open the room ›</Text>
        {gig.url ? (
          <Pressable onPress={() => Linking.openURL(gig.url!)} hitSlop={8}>
            <Text style={styles.link}>Tickets</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 11,
  },
  hot: { backgroundColor: Palette.coralTint, borderColor: 'transparent' },
  pressed: { opacity: 0.9 },
  name: {
    fontFamily: FontFamily.display,
    color: Palette.ink,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  meta: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12.5,
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  cta: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.coral,
    fontSize: 12,
  },
  link: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 12,
  },
});
