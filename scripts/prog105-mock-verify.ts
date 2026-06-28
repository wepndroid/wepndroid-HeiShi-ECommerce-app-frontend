/** PROG-105 mock-mode local auth — run: npx tsx scripts/prog105-mock-verify.ts */
import Module from 'module';

const memory = new Map<string, string>();
const memoryStorage = {
  getItem: async (key: string) => (memory.has(key) ? memory.get(key)! : null),
  setItem: async (key: string, value: string) => memory.set(key, value),
  removeItem: async (key: string) => memory.delete(key),
  multiRemove: async (keys: string[]) => keys.forEach((k) => memory.delete(k)),
  clear: async () => memory.clear(),
};

const originalLoad = (Module as unknown as { _load: Function })._load;
(Module as unknown as { _load: Function })._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === '@react-native-async-storage/async-storage') {
    return { default: memoryStorage, ...memoryStorage };
  }
  return originalLoad.call(this, request, parent, isMain);
};

async function main() {
  const { loginAccount, registerAccount, logoutSession } = await import('../src/data/auth');
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: boolean) => {
    results.push({ name, pass });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
  };

  await memoryStorage.clear();
  const login = await loginAccount('0400000000', 'demo123');
  check('Mock demo login works', 'user' in login && login.user.nickname === 'Holden');
  check('Mock demo has heishiId', 'user' in login && login.user.heishiId === 'HS12345678');

  await logoutSession();
  const phone = `04${String(Date.now()).slice(-8)}`;
  const reg = await registerAccount({
    nickname: 'MockUser',
    phone,
    password: 'secret1',
    confirmPassword: 'secret1',
    verificationCode: '123456',
  });
  check('Mock local register works', 'user' in reg && reg.user.heishiId.startsWith('HS'));

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} mock checks passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
