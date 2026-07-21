import { Stack } from 'expo-router';

/** Product categories and their public listing pages are available to guests. */
export default function CategoryStackLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
