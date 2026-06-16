/**
 * PROG-105 bootstrap + mock-mode verification.
 * Run: npx tsx scripts/prog105-bootstrap-verify.ts
 */
import Module from 'module';

const memory = new Map<string, string>();
const memoryStorage = {
  getItem: async (key: string) => (memory.has(key) ? memory.get(key)! : null),
  setItem: async (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: async (key: string) => {
    memory.delete(key);
  },
  multiRemove: async (keys: string[]) => {
    keys.forEach((key) => memory.delete(key));
  },
  clear: async () => {
    memory.clear();
  },
};

const originalLoad = (Module as unknown as { _load: Function })._load;
(Module as unknown as { _load: Function })._load = function (
  request: string,
  parent: unknown,
  isMain: boolean,
) {
  if (request === '@react-native-async-storage/async-storage') {
    return { default: memoryStorage, ...memoryStorage };
  }
  return originalLoad.call(this, request, parent, isMain);
};

process.env.EXPO_PUBLIC_API_MOCK_FALLBACK = 'false';
process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8001/v1';

async function main() {
  const { AUTH_TOKEN_KEY } = await import('../src/api/config');
  const { bootstrapAuth, loginWithAuth, logoutWithAuth } = await import('../src/services/authService');
  const { saveSession, loginAccount, registerAccount, logoutSession } = await import('../src/data/auth');

  const results: { name: string; pass: boolean; detail?: string }[] = [];
  const check = (name: string, pass: boolean, detail?: string) => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  await memoryStorage.clear();

  await saveSession({
    id: '00000000-0000-4000-8000-000000000001',
    heishiId: 'HS12345678',
    nickname: 'StaleDemo',
    phone: '0400000000',
  });
  await memoryStorage.setItem(AUTH_TOKEN_KEY, 'invalid-token');

  check(
    'Bootstrap ignores stale session when token invalid (API mode)',
    (await bootstrapAuth()) === null,
  );

  await memoryStorage.clear();
  const login = await loginWithAuth('0400000000', 'demo123');
  check('Live login via authService', 'user' in login);

  const bootValid = await bootstrapAuth();
  check('Bootstrap restores valid session (simulated relaunch)', bootValid?.nickname === 'Holden');
  check('Bootstrap user UUID id', Boolean(bootValid?.id?.includes('-')), bootValid?.id);
  check('Bootstrap user heishiId', Boolean(bootValid?.heishiId?.startsWith('HS')), bootValid?.heishiId);

  await logoutWithAuth();
  check('Bootstrap logged out after logout', (await bootstrapAuth()) === null);
  check('Logout clears access token', (await memoryStorage.getItem(AUTH_TOKEN_KEY)) === null);
  check('Logout clears authSession', (await memoryStorage.getItem('authSession')) === null);

  process.env.EXPO_PUBLIC_API_MOCK_FALLBACK = 'true';
  await memoryStorage.clear();
  await logoutSession();
  const mockLogin = await loginAccount('0400000000', 'demo123');
  check('Mock demo login works', 'user' in mockLogin && mockLogin.user.nickname === 'Holden');

  const mockPhone = `04${String(Date.now()).slice(-8)}`;
  await logoutSession();
  const mockReg = await registerAccount({
    nickname: 'MockUser',
    phone: mockPhone,
    password: 'secret1',
    confirmPassword: 'secret1',
  });
  check('Mock local register works', 'user' in mockReg && mockReg.user.heishiId.startsWith('HS'));

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} bootstrap/mock checks passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
