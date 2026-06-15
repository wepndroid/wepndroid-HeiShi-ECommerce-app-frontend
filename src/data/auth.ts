import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  nickname: string;
  phone: string;
}

interface StoredAccount extends AuthUser {
  password: string;
}

const SESSION_KEY = 'authSession';
const ACCOUNTS_KEY = 'authAccounts';

const DEMO_ACCOUNT: StoredAccount = {
  id: '12345678',
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
  | 'networkError';

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

export async function loadSession(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as AuthUser;
    if (user?.id && user.nickname && user.phone) return user;
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
  return phone.replace(/\s+/g, '');
}

export function isValidPhone(phone: string) {
  return /^(\+?61|0)\d{8,10}$/.test(normalizePhone(phone));
}

export function validateRegisterInput(input: {
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): AuthErrorKey | null {
  const nickname = input.nickname.trim();
  const phone = normalizePhone(input.phone.trim());
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!nickname) return 'nicknameRequired';
  if (!phone) return 'phoneRequired';
  if (!isValidPhone(phone)) return 'phoneInvalid';
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
}): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateRegisterInput(input);
  if (validationError) return { error: validationError };

  const nickname = input.nickname.trim();
  const phone = normalizePhone(input.phone.trim());
  const password = input.password;

  const accounts = await readAccounts();
  if (accounts.some((a) => a.phone === phone)) return { error: 'phoneTaken' };

  const user: StoredAccount = {
    id: String(Date.now()).slice(-8),
    nickname,
    phone,
    password,
  };
  await writeAccounts([...accounts, user]);
  const session: AuthUser = { id: user.id, nickname: user.nickname, phone: user.phone };
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

  const user: AuthUser = { id: match.id, nickname: match.nickname, phone: match.phone };
  await saveSession(user);
  return { user };
}

export async function logoutSession() {
  await saveSession(null);
}
