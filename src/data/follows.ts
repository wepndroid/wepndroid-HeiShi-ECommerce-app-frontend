import AsyncStorage from '@react-native-async-storage/async-storage';

const FOLLOWS_KEY = 'userFollows';

/** Match Backend/app/seed.py seller id convention. */
export function resolveSellerUserId(sellerKey: string): string {
  return sellerKey.length > 8 ? sellerKey : `seller-${sellerKey}`;
}

export async function loadLocalFollows(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(FOLLOWS_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed.map(resolveSellerUserId) : []);
  } catch {
    return new Set();
  }
}

export async function saveLocalFollows(follows: Set<string>) {
  await AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify([...follows]));
}