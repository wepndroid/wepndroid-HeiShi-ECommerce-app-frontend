import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'catalogViewHistory';

export async function loadLocalHistory(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordLocalView(listingId: number) {
  const current = await loadLocalHistory();
  const next = [listingId, ...current.filter((id) => id !== listingId)].slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}
