import { paymentsApi, userApi } from '../api';
import { mapListingToProduct } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type {
  AddressDto,
  AuthUserDto,
  CreditProfileDto,
  PayoutMethodDto,
  PublicUserProfileDto,
  ReviewSummaryDto,
  ReceivedReviewDto,
  PendingReviewOrderDto,
  UserProfileUpdateRequest,
} from '../api/types';
import type { AuthUser } from '../data/auth';
import { isPersistedAvatarUrl } from '../utils/sellerAvatar';
import { uploadAvatarImage } from './listingsService';
import { mockPublicListingProducts, mockPublicProfile } from '../data/publicProfiles';
import {
  addLocalAddress,
  deleteLocalAddress,
  loadLocalAddresses,
  updateLocalAddress,
  loadLocalProfile,
  loadLocalVerification,
  mockCreditProfile,
  mockPayoutMethods,
  mockReviewSummary,
  mockReceivedReviews,
  saveLocalProfile,
} from '../data/userLocal';

export type VerificationStatus = Awaited<ReturnType<typeof userApi.getVerificationStatus>>;

export async function fetchUserProfile(
  user: AuthUser | null,
  isLoggedIn: boolean,
): Promise<AuthUserDto> {
  if (isLoggedIn) {
    try {
      return await userApi.getProfile();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return loadLocalProfile(user);
    }
  }
  return loadLocalProfile(user);
}

export async function updateUserProfile(
  user: AuthUser | null,
  isLoggedIn: boolean,
  patch: UserProfileUpdateRequest,
): Promise<AuthUserDto> {
  if (isLoggedIn) {
    try {
      return await userApi.updateProfile(patch);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('profile_update_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return saveLocalProfile(user, patch);
  }
  throw new Error('profile_update_failed');
}

/** Pick, upload, and persist a profile avatar. Returns the server-stored URL. */
export async function saveUserAvatar(
  user: AuthUser | null,
  isLoggedIn: boolean,
  localUri: string,
  mimeType?: string,
  fileName?: string,
): Promise<string> {
  const uploadedUrl = await uploadAvatarImage(
    localUri,
    isLoggedIn,
    mimeType,
    fileName ?? 'avatar.jpg',
  );
  if (!isPersistedAvatarUrl(uploadedUrl)) {
    throw new Error('AVATAR_UPLOAD_FAILED');
  }
  const profile = await updateUserProfile(user, isLoggedIn, { avatarUrl: uploadedUrl });
  if (!profile.avatarUrl || !isPersistedAvatarUrl(profile.avatarUrl)) {
    throw new Error('AVATAR_SAVE_FAILED');
  }
  return profile.avatarUrl;
}

export async function listAddresses(isLoggedIn: boolean): Promise<AddressDto[]> {
  if (isLoggedIn) {
    try {
      return await userApi.getAddresses();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return loadLocalAddresses();
  }
  return [];
}

export async function createAddress(
  body: Omit<AddressDto, 'id'>,
  isLoggedIn: boolean,
): Promise<AddressDto> {
  if (isLoggedIn) {
    try {
      return await userApi.addAddress(body);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('address_create_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return addLocalAddress(body);
  }
  throw new Error('address_create_failed');
}

export async function removeAddress(id: string, isLoggedIn: boolean): Promise<void> {
  if (isLoggedIn) {
    try {
      await userApi.deleteAddress(id);
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('address_delete_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    await deleteLocalAddress(id);
    return;
  }
  throw new Error('address_delete_failed');
}

export async function updateAddress(
  id: string,
  patch: Partial<Omit<AddressDto, 'id'>>,
  isLoggedIn: boolean,
): Promise<AddressDto> {
  if (isLoggedIn) {
    try {
      return await userApi.updateAddress(id, patch);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('address_update_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return updateLocalAddress(id, patch);
  }
  throw new Error('address_update_failed');
}

export async function fetchVerificationStatus(isLoggedIn: boolean): Promise<VerificationStatus> {
  if (isLoggedIn) {
    try {
      return await userApi.getVerificationStatus();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return loadLocalVerification(false);
    }
  }
  return loadLocalVerification(isLoggedIn);
}

export async function fetchCreditProfile(isLoggedIn: boolean): Promise<CreditProfileDto> {
  if (isLoggedIn) {
    return userApi.getCreditProfile();
  }
  if (API_USE_MOCK_FALLBACK) {
    return mockCreditProfile();
  }
  throw new Error('credit_profile_failed');
}

export async function fetchReviewSummary(isLoggedIn: boolean): Promise<ReviewSummaryDto> {
  if (isLoggedIn) {
    try {
      return await userApi.getReviewSummary();
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('review_summary_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return mockReviewSummary();
  }
  throw new Error('review_summary_failed');
}

export async function fetchReceivedReviews(
  isLoggedIn: boolean,
  role: 'seller' | 'buyer' = 'seller',
  page = 1,
  pageSize = 20,
): Promise<ReceivedReviewDto[]> {
  if (isLoggedIn) {
    try {
      const result = await userApi.listReceivedReviews({ page, pageSize, role });
      return result.items;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('received_reviews_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return role === 'seller' ? mockReceivedReviews() : [];
  }
  throw new Error('received_reviews_failed');
}

export async function fetchPendingReviewOrders(isLoggedIn: boolean): Promise<PendingReviewOrderDto[]> {
  if (isLoggedIn) {
    try {
      return await userApi.listPendingReviews();
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('pending_reviews_failed');
    }
  }
  return [];
}

export async function listPayoutMethods(isLoggedIn: boolean): Promise<PayoutMethodDto[]> {
  if (isLoggedIn) {
    try {
      return await paymentsApi.listPayoutMethods();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return mockPayoutMethods();
  }
  return [];
}

export async function addPayoutMethod(
  type: PayoutMethodDto['type'],
  isLoggedIn: boolean,
): Promise<PayoutMethodDto> {
  if (isLoggedIn) {
    try {
      return await paymentsApi.addPayoutMethod({ type, accountToken: 'demo-account' });
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('payout_add_failed');
    }
  }
  throw new Error('payout_add_failed');
}

export async function removePayoutMethod(methodId: string, isLoggedIn: boolean): Promise<void> {
  if (isLoggedIn) {
    try {
      await paymentsApi.removePayoutMethod(methodId);
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('payout_remove_failed');
    }
  }
  throw new Error('payout_remove_failed');
}

export async function setDefaultPayoutMethod(
  methodId: string,
  isLoggedIn: boolean,
): Promise<PayoutMethodDto> {
  if (isLoggedIn) {
    try {
      return await paymentsApi.setDefaultPayoutMethod(methodId);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('payout_default_failed');
    }
  }
  throw new Error('payout_default_failed');
}

export async function bindVerification(
  type: 'wechat' | 'alipay' | 'identity' | 'business',
  isLoggedIn: boolean,
): Promise<VerificationStatus> {
  if (isLoggedIn) {
    try {
      return await userApi.bindVerification(type);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('verification_bind_failed');
    }
  }
  throw new Error('verification_bind_failed');
}

export async function fetchPublicUserProfile(userId: string): Promise<PublicUserProfileDto> {
  try {
    return await userApi.getPublicProfile(userId);
  } catch {
    if (API_USE_MOCK_FALLBACK) {
      const profile = mockPublicProfile(userId);
      if (!profile) throw new Error('public_profile_not_found');
      return profile;
    }
    throw new Error('public_profile_failed');
  }
}

export async function fetchPublicUserListings(userId: string) {
  try {
    const items: Awaited<ReturnType<typeof userApi.getPublicListings>>['items'] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 25) {
      const result = await userApi.getPublicListings(userId, { page, pageSize: 50 });
      items.push(...result.items);
      hasMore = result.hasMore;
      page += 1;
    }
    return items.map(mapListingToProduct);
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockPublicListingProducts(userId);
    throw new Error('public_listings_failed');
  }
}
