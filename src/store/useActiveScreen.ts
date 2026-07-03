import { usePathname } from 'expo-router';
import { pathnameToScreenId } from '../routing/paths';
import type { ScreenId, TabScreenId } from '../types';

export const TAB_MAP: Partial<Record<ScreenId, TabScreenId>> = {
  home: 'home',
  category: 'category',
  publish: 'publish',
  messages: 'messages',
  profile: 'profile',
};

// The active screen/tab is derived from the router pathname, so it must be a
// hook (usePathname) rather than store state.
export function useActiveScreen(): { current: ScreenId; activeTab: TabScreenId | null } {
  const pathname = usePathname();
  const current = pathnameToScreenId(pathname);
  return { current, activeTab: TAB_MAP[current] ?? null };
}
