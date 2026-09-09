import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Section } from '@/constants/theme';
import type { PlanWithRsvp } from './types';

const EMERALD = Section.groups.color;

function formatWhen(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = date
    .toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(' ', '')
    .toLowerCase();
  return `${day} · ${time}`;
}

type Props = {
  plan: PlanWithRsvp;
  onRsvp: (status: 'in' | 'out') => void;
};

export function PlanCard({ plan, onRsvp }: Props) {
  const meta = [formatWhen(plan.startsAt), plan.location, `${plan.goingCount} going`]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <Text style={styles.pin}>📌 Next plan</Text>
      <Text style={styles.title}>{plan.title}</Text>
      <Text style={styles.meta}>{meta}</Text>
      {plan.details ? <Text style={styles.details}>{plan.details}</Text> : null}

      <View style={styles.rsvp}>
        <Pressable
          onPress={() => onRsvp('in')}
          style={[styles.chip, plan.myStatus === 'in' ? styles.inOn : styles.inOff]}>
          <Text
            style={[
              styles.chipText,
              plan.myStatus === 'in' ? styles.inOnText : styles.inOffText,
            ]}>
            I'm in
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onRsvp('out')}
          style={[styles.chip, plan.myStatus === 'out' ? styles.outOn : styles.outOff]}>
          <Text
            style={[
              styles.chipText,
              plan.myStatus === 'out' ? styles.outOnText : styles.outOffText,
            ]}>
            Can't make it
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Section.groups.tint,
    borderRadius: 15,
    padding: 13,
    margin: 12,
    marginBottom: 4,
  },
  pin: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.inkSoft,
    fontSize: 10.5,
  },
  title: {
    fontFamily: FontFamily.display,
    color: Palette.ink,
    fontSize: 16,
    marginTop: 4,
  },
  meta: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
  details: {
    fontFamily: FontFamily.body,
    color: Palette.ink,
    fontSize: 12.5,
    marginTop: 6,
  },
  rsvp: { flexDirection: 'row', gap: 8, marginTop: 11 },
  chip: { borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12 },
  inOn: { backgroundColor: EMERALD },
  inOnText: { color: '#FFFFFF' },
  inOff: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Palette.line },
  inOffText: { color: Palette.ink },
  outOn: { backgroundColor: Palette.ink },
  outOnText: { color: '#FFFFFF' },
  outOff: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Palette.line },
  outOffText: { color: Palette.inkSoft },
});
