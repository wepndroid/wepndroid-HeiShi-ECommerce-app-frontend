import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
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

const DEFAULT_PROFILE: Pick<AuthUserDto, 'bio' | 'city' | 'language' | 'avatarUrl'> = {
  bio: '',
  city: 'Melbourne',
  language: 'en',
  avatarUrl: undefined,
};

function localizedProfileDefaults(): Pick<AuthUserDto, 'bio' | 'city' | 'language'> {
  return {
    bio: i18n.t('profileDefaults.bio'),
    city: 'Melbourne',
    language: i18n.language.startsWith('zh') ? 'zh' : 'en',
  };
}

function defaultAddresses(): AddressDto[] {
  return [
    {
      id: 'addr-default',
      label: i18n.t('profileDefaults.addressLabel'),
      area: 'Melbourne CBD',
      isDefault: true,
    },
    {
      id: 'addr-meetup',
      label: i18n.t('profileDefaults.meetupLabel'),
      area: 'Clayton',
      meetupSpot: i18n.t('profileDefaults.meetupSpot'),
    },
  ];
}

const DEFAULT_ADDRESSES: AddressDto[] = [];

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

function mockPayoutMethodsLocalized(): PayoutMethodDto[] {
  return [
    {
      id: 'demo-bank',
      type: 'bank',
      label: i18n.t('profileDefaults.payoutBank'),
      last4: '0918',
      isDefault: true,
    },
  ];
}

function profileFromSession(user: AuthUser | null): AuthUserDto {
  return {
    id: user?.id ?? 'guest',
    heishiId: user?.heishiId ?? user?.id ?? 'guest',
    nickname: user?.nickname ?? i18n.t('common.guest'),
    phone: user?.phone ?? '',
    ...localizedProfileDefaults(),
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
  const base = profileFromSession(user);
  return {
    ...base,
    ...extras,
    bio: extras.bio || base.bio,
    language: extras.language ?? base.language,
  };
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
    avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : current.avatarUrl,
  };
  await writeJson(PROFILE_KEY, extras);
  return {
    ...current,
    nickname: patch.nickname ?? current.nickname,
    ...extras,
  };
}

export async function loadLocalAddresses(): Promise<AddressDto[]> {
  const rows = await readJson(ADDRESSES_KEY, DEFAULT_ADDRESSES);
  return rows.length ? rows : defaultAddresses();
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
  await writeJson(ADDRESSES_KEY, next.length ? next : defaultAddresses());
}

export async function updateLocalAddress(
  id: string,
  patch: Partial<Omit<AddressDto, 'id'>>,
): Promise<AddressDto> {
  const rows = await loadLocalAddresses();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) throw new Error('address_not_found');
  const nextRows = rows.map((row) => {
    if (row.id === id) {
      return { ...row, ...patch, id: row.id };
    }
    if (patch.isDefault) {
      return { ...row, isDefault: false };
    }
    return row;
  });
  await writeJson(ADDRESSES_KEY, nextRows);
  const updated = nextRows.find((row) => row.id === id);
  if (!updated) throw new Error('address_not_found');
  return updated;
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
  return mockPayoutMethodsLocalized();
}
