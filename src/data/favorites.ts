import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'catalogFavorites';

const DEFAULT_FAVORITE_IDS = [1, 3, 5, 6, 13, 15];

export async function loadLocalFavorites(): Promise<Set<number>> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return new Set(DEFAULT_FAVORITE_IDS);
  try {
    const parsed = JSON.parse(raw) as number[];
    return new Set(Array.isArray(parsed) ? parsed : DEFAULT_FAVORITE_IDS);
  } catch {
    return new Set(DEFAULT_FAVORITE_IDS);
  }
}

export async function saveLocalFavorites(favs: Set<number>) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}
