import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AddressDto,
  AuthUserDto,
  CreditProfileDto,
  PayoutMethodDto,
  ReviewSummaryDto,
  UserProfileUpdateRequest,
} from '../api/types';
import type { AuthUser } from './auth';

const PROFILE_KEY = 'userProfileExtras';
const ADDRESSES_KEY = 'userAddresses';
const VERIFICATION_KEY = 'userVerification';

const DEFAULT_PROFILE: Pick<AuthUserDto, 'bio' | 'city' | 'language'> = {
  bio: 'Melbourne student · furniture & appliances',
  city: 'Melbourne',
  language: 'en',
};

const DEFAULT_ADDRESSES: AddressDto[] = [
  {
    id: 'addr-default',
    label: 'Default area',
    area: 'Melbourne CBD',
    isDefault: true,
  },
  {
    id: 'addr-meetup',
    label: 'Meetup spot',
    area: 'Clayton',
    meetupSpot: 'Monash Clayton Library',
  },
];

const DEFAULT_VERIFICATION = {
  phoneVerified: true,
  wechatBound: true,
  alipayBound: false,
  identityVerified: false,
  businessVerified: false,
};

const DEFAULT_CREDIT: CreditProfileDto = {
  score: 86,
  trades: 12,
  completionRate: 98,
  violations: 0,
  rating: 4.9,
};

const DEFAULT_REVIEW: ReviewSummaryDto = {
  score: 4.9,
  pendingCount: 0,
};

const MOCK_PAYOUT_METHODS: PayoutMethodDto[] = [
  {
    id: 'demo-bank',
    type: 'bank',
    label: 'Commonwealth Bank',
    last4: '0918',
    isDefault: true,
  },
];

function profileFromSession(user: AuthUser | null): AuthUserDto {
  return {
    id: user?.id ?? 'guest',
    heishiId: user?.heishiId ?? user?.id ?? 'guest',
    nickname: user?.nickname ?? 'Guest',
    phone: user?.phone ?? '',
    ...DEFAULT_PROFILE,
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadLocalProfile(user: AuthUser | null): Promise<AuthUserDto> {
  const extras = await readJson(PROFILE_KEY, DEFAULT_PROFILE);
  return { ...profileFromSession(user), ...extras };
}

export async function saveLocalProfile(
  user: AuthUser | null,
  patch: UserProfileUpdateRequest,
): Promise<AuthUserDto> {
  const current = await loadLocalProfile(user);
  const extras = {
    bio: patch.bio ?? current.bio,
    city: patch.city ?? current.city,
    language: patch.language ?? current.language,
  };
  await writeJson(PROFILE_KEY, extras);
  return {
    ...current,
    nickname: patch.nickname ?? current.nickname,
    avatarUrl: patch.avatarUrl ?? current.avatarUrl,
    ...extras,
  };
}

export async function loadLocalAddresses(): Promise<AddressDto[]> {
  return readJson(ADDRESSES_KEY, DEFAULT_ADDRESSES);
}

export async function addLocalAddress(body: Omit<AddressDto, 'id'>): Promise<AddressDto> {
  const rows = await loadLocalAddresses();
  const entry: AddressDto = { ...body, id: `addr-${Date.now()}` };
  const next = body.isDefault
    ? [entry, ...rows.map((row) => ({ ...row, isDefault: false }))]
    : [...rows, entry];
  await writeJson(ADDRESSES_KEY, next);
  return entry;
}

export async function deleteLocalAddress(id: string): Promise<void> {
  const next = (await loadLocalAddresses()).filter((row) => row.id !== id);
  await writeJson(ADDRESSES_KEY, next.length ? next : DEFAULT_ADDRESSES);
}

export async function loadLocalVerification(isLoggedIn: boolean) {
  if (!isLoggedIn) {
    return {
      phoneVerified: false,
      wechatBound: false,
      alipayBound: false,
      identityVerified: false,
      businessVerified: false,
    };
  }
  return readJson(VERIFICATION_KEY, DEFAULT_VERIFICATION);
}

export function mockCreditProfile(): CreditProfileDto {
  return DEFAULT_CREDIT;
}

export function mockReviewSummary(): ReviewSummaryDto {
  return DEFAULT_REVIEW;
}

export function mockPayoutMethods(): PayoutMethodDto[] {
  return MOCK_PAYOUT_METHODS;
}
