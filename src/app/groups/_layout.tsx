import { Stack } from 'expo-router';

// The Groups tab is a stack: the list, then a pushed chat screen. Screens draw
// their own headers, so the native header is hidden.
export default function GroupsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
