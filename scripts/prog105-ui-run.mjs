/** PROG-105 Expo web UI verification — run: node scripts/prog105-ui-run.mjs */
import { chromium } from 'playwright';

const BASE = process.env.EXPO_WEB_URL || 'http://127.0.0.1:19006';
const results = [];

function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function waitText(page, pattern, timeout = 12000) {
  try {
    await page.getByText(pattern).first().waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

async function goto(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await goto(page, '/register');
    check('Open /register', await waitText(page, /Register|注册/));

    await page.getByText(/^Register$|^注册$/).last().click();
    check('Empty register validation toast', await waitText(page, /Enter a nickname|请输入昵称/));

    await goto(page, '/register');
    const inputs = page.locator('input');
    await inputs.nth(0).fill('TestUser');
    await inputs.nth(1).fill('0400112233');
    await inputs.nth(2).fill('secret1');
    await inputs.nth(3).fill('secret2');
    await page.getByText(/^Register$|^注册$/).last().click();
    check('Password mismatch toast', await waitText(page, /Passwords do not match|两次密码不一致/));

    await goto(page, '/register');
    await inputs.nth(0).fill('TestUser');
    await inputs.nth(1).fill('123');
    await inputs.nth(2).fill('secret1');
    await inputs.nth(3).fill('secret1');
    await page.getByText(/^Register$|^注册$/).last().click();
    check('Invalid phone toast', await waitText(page, /valid Australian mobile|有效.*手机/));

    await goto(page, '/login');
    check('Open /login', await waitText(page, /Log in|登录/));

    await page.locator('input').nth(0).fill('0400000000');
    await page.locator('input').nth(1).fill('wrongpass');
    await page.getByText(/^Log in$|^登录$/).last().click();
    check(
      'Wrong password toast',
      await waitText(page, /Incorrect phone number or password|手机号或密码错误/),
    );

    await goto(page, '/login');
    await page.locator('input').nth(0).fill('0499999999');
    await page.locator('input').nth(1).fill('wrongpass');
    await page.getByText(/^Log in$|^登录$/).last().click();
    check(
      'Unknown phone toast (invalidCredentials)',
      await waitText(page, /Incorrect phone number or password|手机号或密码错误/),
    );

    await goto(page, '/');
    const postTab = page.getByText(/^Post$|^发布$/).first();
    if (await postTab.isVisible().catch(() => false)) {
      await postTab.click();
      check(
        'Guest Post tab -> login prompt',
        await waitText(page, /Please sign in to continue|请先登录/),
      );
    } else {
      check('Guest Post tab -> login prompt', false, 'Post tab not visible');
    }

    // Note: live register/login against API requires backend on :8000 (Expo .env).
    // Client-side validation paths above cover register/login error UX.
  } catch (err) {
    console.error('UI run error:', err.message);
    check('UI runner completed without crash', false, err.message);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} UI checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main();
