import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, Palette, Section, type SectionKey } from '@/constants/theme';

type Props = {
  section: SectionKey;
  /** Small line above the big title, e.g. a date or a subtitle. */
  kicker: string;
  /** Short line of body copy under the header. Optional when `children` are given. */
  blurb?: string;
  /** Screen content rendered under the header, on the warm background. */
  children?: ReactNode;
};

/**
 * The shared shell for a top-level tab screen: a section-coloured top bar with
 * the tandem wordmark + big display title, over the warm app background. Mirrors
 * the `.topbar` blocks in design/tandem-app.html. Screen content goes in `blurb`
 * for now — real content lands feature by feature.
 */
export function TandemScreen({ section, kicker, blurb, children }: Props) {
  const s = Section[section];
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: s.color }}>
        <View style={styles.topbar}>
          <View style={styles.markRow}>
            <View style={styles.dot} />
            <Text style={styles.mark}>tandem</Text>
          </View>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{s.label}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        {blurb ? <Text style={styles.blurb}>{blurb}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  topbar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  mark: {
    fontFamily: FontFamily.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: -0.4,
  },
  kicker: {
    fontFamily: FontFamily.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 12,
  },
  title: {
    fontFamily: FontFamily.display,
    color: '#FFFFFF',
    fontSize: 34,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  blurb: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
  },
});
