import AsyncStorage from '@react-native-async-storage/async-storage';
import { isKnownCity } from './region';

export interface AuthUser {
  id: string;
  heishiId: string;
  nickname: string;
  phone: string;
  avatarUrl?: string;
}

interface StoredAccount extends AuthUser {
  password: string;
}

const SESSION_KEY = 'authSession';
const ACCOUNTS_KEY = 'authAccounts';

const DEMO_ACCOUNT: StoredAccount = {
  id: '00000000-0000-4000-8000-000000000001',
  heishiId: 'HS12345678',
  nickname: 'Holden',
  phone: '0400000000',
  password: 'demo123',
};

export type AuthErrorKey =
  | 'phoneRequired'
  | 'phoneInvalid'
  | 'passwordRequired'
  | 'passwordShort'
  | 'nicknameRequired'
  | 'passwordMismatch'
  | 'phoneTaken'
  | 'invalidCredentials'
  | 'networkError'
  | 'codeRequired'
  | 'codeInvalid'
  | 'codeExpired'
  | 'codeRateLimit'
  | 'avatarRequired'
  | 'avatarUploadFailed'
  | 'cityRequired'
  | 'oauthUnavailable';

async function readAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify([DEMO_ACCOUNT]));
    return [DEMO_ACCOUNT];
  }
  try {
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [DEMO_ACCOUNT];
  } catch {
    return [DEMO_ACCOUNT];
  }
}

async function writeAccounts(accounts: StoredAccount[]) {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function normalizeAuthUser(raw: AuthUser): AuthUser | null {
  if (!raw?.id || !raw.nickname || !raw.phone) return null;
  return {
    id: raw.id,
    heishiId: raw.heishiId ?? raw.id,
    nickname: raw.nickname,
    phone: raw.phone,
    avatarUrl: raw.avatarUrl,
  };
}

export async function loadSession(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return normalizeAuthUser(JSON.parse(raw) as AuthUser);
  } catch {
    // ignore corrupt session
  }
  return null;
}

export async function saveSession(user: AuthUser | null) {
  if (!user) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+86')) return cleaned;
  if (cleaned.startsWith('86') && cleaned.length >= 13) return `+${cleaned}`;
  if (/^1[3-9]\d{9}$/.test(cleaned)) return `+86${cleaned}`;
  if (cleaned.startsWith('+61')) return `0${cleaned.slice(3)}`;
  if (cleaned.startsWith('61') && cleaned.length >= 11) return `0${cleaned.slice(2)}`;
  return cleaned;
}

export function isValidPhone(phone: string) {
  const normalized = normalizePhone(phone.trim());
  if (normalized.startsWith('+86')) return /^\+861[3-9]\d{9}$/.test(normalized);
  return /^(\+?61|0)\d{8,10}$/.test(normalized);
}

export function validateRegisterPhoneStep(input: {
  phone: string;
  city?: string;
}): AuthErrorKey | null {
  const phone = normalizePhone(input.phone.trim());
  if (!phone) return 'phoneRequired';
  if (!isValidPhone(phone)) return 'phoneInvalid';
  if (input.city !== undefined && !input.city.trim()) return 'cityRequired';
  if (input.city !== undefined && !isKnownCity(input.city)) return 'cityRequired';
  return null;
}

export function validateRegisterAvatarStep(avatarUri: string | null | undefined): AuthErrorKey | null {
  if (!avatarUri?.trim()) return 'avatarRequired';
  return null;
}

export function hasRegisterAvatar(avatarUri: string | null | undefined): boolean {
  return validateRegisterAvatarStep(avatarUri) === null;
}

export function validateRegisterInput(input: {
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
  avatarUri: string;
  city: string;
}): AuthErrorKey | null {
  if (!input.nickname.trim()) return 'nicknameRequired';
  const avatarError = validateRegisterAvatarStep(input.avatarUri);
  if (avatarError) return avatarError;
  const phoneStep = validateRegisterPhoneStep({ phone: input.phone, city: input.city });
  if (phoneStep) return phoneStep;
  const password = input.password;
  const confirmPassword = input.confirmPassword;
  const code = input.verificationCode.trim();

  if (!code) return 'codeRequired';
  if (code.length !== 6) return 'codeInvalid';
  if (!password) return 'passwordRequired';
  if (password.length < 6) return 'passwordShort';
  if (password !== confirmPassword) return 'passwordMismatch';
  return null;
}

export function validateLoginInput(phone: string, password: string): AuthErrorKey | null {
  if (!normalizePhone(phone.trim())) return 'phoneRequired';
  if (!password) return 'passwordRequired';
  return null;
}

export async function registerAccount(input: {
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
  avatarUri: string;
  city: string;
}): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateRegisterInput(input);
  if (validationError) return { error: validationError };

  const nickname = input.nickname.trim();
  const phone = normalizePhone(input.phone.trim());
  const password = input.password;
  const code = input.verificationCode.trim();

  if (code !== '123456') return { error: 'codeInvalid' };

  const accounts = await readAccounts();
  if (accounts.some((a) => a.phone === phone)) return { error: 'phoneTaken' };

  const user: StoredAccount = {
    id: `local-${Date.now()}`,
    heishiId: `HS${phone.slice(-8)}`,
    nickname,
    phone,
    password,
  };
  await writeAccounts([...accounts, user]);
  const session: AuthUser = {
    id: user.id,
    heishiId: user.heishiId,
    nickname: user.nickname,
    phone: user.phone,
  };
  await saveSession(session);
  return { user: session };
}

export async function loginAccount(
  phone: string,
  password: string,
): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateLoginInput(phone, password);
  if (validationError) return { error: validationError };

  const normalizedPhone = normalizePhone(phone.trim());

  const accounts = await readAccounts();
  const match = accounts.find((a) => a.phone === normalizedPhone && a.password === password);
  if (!match) return { error: 'invalidCredentials' };

  const user: AuthUser = {
    id: match.id,
    heishiId: match.heishiId ?? match.id,
    nickname: match.nickname,
    phone: match.phone,
  };
  await saveSession(user);
  return { user };
}

export async function logoutSession() {
  await saveSession(null);
}
