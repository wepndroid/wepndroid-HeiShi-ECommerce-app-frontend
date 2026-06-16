/**
 * PROG-105 auth verification — client validation (sync checks only).
 * Run: npx tsx scripts/prog105-verify.ts
 */
import {
  validateLoginInput,
  validateRegisterInput,
} from '../src/data/auth';

const results: { name: string; pass: boolean; detail?: string }[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  // --- Register client validation ---
  check(
    'Empty register → nicknameRequired',
    validateRegisterInput({ nickname: '', phone: '', password: '', confirmPassword: '' }) ===
      'nicknameRequired',
  );
  check(
    'Register phone only → phoneRequired',
    validateRegisterInput({ nickname: 'A', phone: '', password: 'secret1', confirmPassword: 'secret1' }) ===
      'phoneRequired',
  );
  check(
    'Register password mismatch',
    validateRegisterInput({
      nickname: 'A',
      phone: '0400111222',
      password: 'secret1',
      confirmPassword: 'secret2',
    }) === 'passwordMismatch',
  );
  check(
    'Register invalid phone 123',
    validateRegisterInput({
      nickname: 'A',
      phone: '123',
      password: 'secret1',
      confirmPassword: 'secret1',
    }) === 'phoneInvalid',
  );

  // --- Login client validation ---
  check('Empty login -> phoneRequired', validateLoginInput('', '') === 'phoneRequired');
  check(
    'Login missing password',
    validateLoginInput('0400000000', '') === 'passwordRequired',
  );

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} client validation checks passed`);
  if (failed.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
