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
  UserProfileUpdateRequest,
} from '../api/types';
import type { AuthUser } from '../data/auth';
import { mockPublicListingProducts, mockPublicProfile } from '../data/publicProfiles';
import {
  addLocalAddress,
  deleteLocalAddress,
  loadLocalAddresses,
  loadLocalProfile,
  loadLocalVerification,
  mockCreditProfile,
  mockPayoutMethods,
  mockReviewSummary,
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
    try {
      return await userApi.getCreditProfile();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return mockCreditProfile();
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return mockCreditProfile();
  }
  return mockCreditProfile();
}

export async function fetchReviewSummary(isLoggedIn: boolean): Promise<ReviewSummaryDto> {
  if (isLoggedIn) {
    try {
      return await userApi.getReviewSummary();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return mockReviewSummary();
    }
  }
  if (API_USE_MOCK_FALLBACK || !isLoggedIn) {
    return mockReviewSummary();
  }
  return mockReviewSummary();
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
    const result = await userApi.getPublicListings(userId, { pageSize: 50 });
    return result.items.map(mapListingToProduct);
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockPublicListingProducts(userId);
    throw new Error('public_listings_failed');
  }
}
