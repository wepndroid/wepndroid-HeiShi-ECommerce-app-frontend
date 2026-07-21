import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'publishProductDraft';

export interface PublishProductDraft {
  savedAt: number;
  resumeAfterPicker?: boolean;
  title: string;
  price: string;
  categoryKey: string;
  conditionKey: string;
  pickupMethodKey: string;
  description: string;
  escrowEnabled: boolean;
  negotiableEnabled: boolean;
  meetInPublic: boolean;
  listingCityKey: string;
  imageUrls: string[];
  videoUrls?: string[];
}

export async function loadPublishProductDraft(): Promise<PublishProductDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PublishProductDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function savePublishProductDraft(draft: PublishProductDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
}

export async function clearPublishProductDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export function shouldResumePublishProduct(draft: PublishProductDraft): boolean {
  if (!draft.resumeAfterPicker) return false;
  return Date.now() - draft.savedAt < 5 * 60 * 1000;
}
