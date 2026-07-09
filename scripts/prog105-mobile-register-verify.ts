/**
 * Mobile register OTP verification — uses the same authService as the RN app
 * with EXPO_PUBLIC_API_MOCK_FALLBACK=false (production mobile path).
 * Run: npx tsx scripts/prog105-mobile-register-verify.ts
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
process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8000/v1';

async function main() {
  const { sendRegisterCode, registerWithAuth, bootstrapAuth } = await import(
    '../src/services/authService'
  );
  const registerBase = {
    avatarUri: 'mock://avatar.jpg',
    city: 'Melbourne',
  };

  const results: { name: string; pass: boolean; detail?: string }[] = [];
  const check = (name: string, pass: boolean, detail?: string) => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  const phone = `04${String(Date.now()).slice(-8)}`;

  const send = await sendRegisterCode(phone);
  check(
    'Mobile sendRegisterCode hits live API',
    !('error' in send) && Boolean(send.devCode),
    'error' in send ? send.error : send.devCode,
  );

  if ('error' in send) {
    console.log('\nAborted — send-code failed (check backend + port 8000).');
    process.exit(1);
  }

  const wrong = await registerWithAuth({
    ...registerBase,
    nickname: 'MobileTest',
    phone,
    password: 'secret1',
    confirmPassword: 'secret1',
    verificationCode: '000000',
  });
  check(
    'Wrong OTP rejected (no mock fallback)',
    'error' in wrong && wrong.error === 'codeInvalid',
    'error' in wrong ? wrong.error : 'registered unexpectedly',
  );

  const verificationCode = send.devCode;
  if (!verificationCode) {
    console.log('\nAborted â€” backend did not expose a dev OTP code.');
    process.exit(1);
  }

  const reg = await registerWithAuth({
    ...registerBase,
    nickname: 'MobileTest',
    phone,
    password: 'secret1',
    confirmPassword: 'secret1',
    verificationCode,
  });
  check(
    'Register with OTP creates session',
    'user' in reg && reg.user.phone === phone.replace(/\s+/g, ''),
    'error' in reg ? reg.error : reg.user.nickname,
  );

  if ('user' in reg) {
    await memoryStorage.setItem('authAccessToken', 'pending');
    const boot = await bootstrapAuth();
    check('Session bootstrap after register', boot?.phone === phone.replace(/\s+/g, ''), boot?.nickname);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} mobile register checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
