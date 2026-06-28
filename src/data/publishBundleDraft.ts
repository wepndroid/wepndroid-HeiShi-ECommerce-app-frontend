import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BundleLineItem } from './bundle';

const DRAFT_KEY = 'publishBundleDraft';

export interface PublishBundleDraft {
  savedAt: number;
  resumeAfterPicker?: boolean;
  title: string;
  price: string;
  pickupDeadline: string;
  pickupWindowKey: string;
  pickupMethodKey: string;
  allowSeparateSale: boolean;
  description: string;
  listingCityKey: string;
  coverImageUrls: string[];
  bundleItems: BundleLineItem[];
}

export async function loadPublishBundleDraft(): Promise<PublishBundleDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PublishBundleDraft;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.bundleItems)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function savePublishBundleDraft(draft: PublishBundleDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
}

export async function clearPublishBundleDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export async function clearPublishBundleResumeFlag(): Promise<void> {
  const draft = await loadPublishBundleDraft();
  if (!draft?.resumeAfterPicker) return;
  await savePublishBundleDraft({ ...draft, resumeAfterPicker: false });
}

export function shouldResumePublishBundle(draft: PublishBundleDraft): boolean {
  if (!draft.resumeAfterPicker) return false;
  return Date.now() - draft.savedAt < 5 * 60 * 1000;
}
