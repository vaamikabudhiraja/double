import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { FontFamily, Palette, Section } from '@/constants/theme';

// Keep the native splash up until the fonts are ready, so there's no flash of a
// fallback font on first paint.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  useEffect(() => {
    // Reveal the app once fonts resolve — even on error, so we never hang on the
    // splash screen (we just fall back to system fonts in that case).
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: Palette.inkSoft,
        tabBarStyle: {
          backgroundColor: Palette.card,
          borderTopColor: Palette.line,
        },
        tabBarLabelStyle: { fontFamily: FontFamily.bodySemiBold, fontSize: 11 },
      }}>
      {/* Each tab keeps its own section colour when active (per the wireframes). */}
      <Tabs.Screen
        name="index"
        options={{
          title: Section.tonight.label,
          tabBarActiveTintColor: Section.tonight.color,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: Section.groups.label,
          tabBarActiveTintColor: Section.groups.color,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meet"
        options={{
          title: Section.meet.label,
          tabBarActiveTintColor: Section.meet.color,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: Section.you.label,
          tabBarActiveTintColor: Section.you.color,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
