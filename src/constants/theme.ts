/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/* -------------------------------------------------------------------------- */
/* Tandem design tokens                                                        */
/* Sourced verbatim from the `:root` variables in design/tandem-*.html so the  */
/* app and the wireframes stay in lockstep. See CLAUDE.md → "Design reference".*/
/* -------------------------------------------------------------------------- */

export const Palette = {
  bg: '#FFFBF4', // warm background
  ink: '#1B1430',
  inkSoft: 'rgba(27,20,48,0.60)',
  line: 'rgba(27,20,48,0.10)',
  card: '#FFFFFF',

  coral: '#FF5A4D', // Tonight
  emerald: '#12B886', // Groups
  violet: '#7A5CFF', // Meet
  blue: '#3B78E7', // You / verify
  yellow: '#FFC23C',
  pink: '#FF4D97',

  coralTint: '#FFEDEB',
  emeraldTint: '#E4F7F0',
  violetTint: '#EFEBFF',
  blueTint: '#E7F0FE',
  yellowTint: '#FFF3D6',
  pinkTint: '#FFE8F2',
} as const;

/** The four bottom-tab sections, each owning a colour (used when active). */
export type SectionKey = 'tonight' | 'groups' | 'meet' | 'you';

export const Section: Record<
  SectionKey,
  { label: string; color: string; tint: string }
> = {
  tonight: { label: 'Tonight', color: Palette.coral, tint: Palette.coralTint },
  groups: { label: 'Groups', color: Palette.emerald, tint: Palette.emeraldTint },
  meet: { label: 'Meet', color: Palette.violet, tint: Palette.violetTint },
  you: { label: 'You', color: Palette.blue, tint: Palette.blueTint },
};

/**
 * Font family keys map to the exact weights we load in app/_layout.tsx via
 * expo-font. Bricolage Grotesque = display, Instrument Sans = body — matching
 * the wireframes' `font-family` rules.
 */
export const FontFamily = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemiBold: 'InstrumentSans_600SemiBold',
} as const;
