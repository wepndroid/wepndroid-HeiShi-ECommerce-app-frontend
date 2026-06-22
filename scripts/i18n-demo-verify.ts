/** ENG-003 guard: demo catalog must not leak English titles/sellers in zh.ts */
import zh from '../src/i18n/locales/zh';

const DEMO_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const FORBIDDEN_TITLE = [/Dyson/i, /SMEG/i, /Marketing/i, /Supersonic/i, /Edifier/i, /Keychron/i];
const ENGLISH_ONLY_SELLERS = ['sunny', 'allen', 'luna', 'amy', 'lily'];

type ZhLocale = typeof zh;

let failed = 0;

for (const id of DEMO_IDS) {
  const title = zh.products.items[id as keyof ZhLocale['products']['items']]?.title ?? '';
  for (const re of FORBIDDEN_TITLE) {
    if (re.test(title)) {
      console.error(`[i18n] product ${id} title still has English brand: "${title}"`);
      failed += 1;
    }
  }
}

for (const key of ENGLISH_ONLY_SELLERS) {
  const name = zh.sellers[key as keyof ZhLocale['sellers']];
  if (name && /^[A-Za-z_]+$/.test(name)) {
    console.error(`[i18n] seller.${key} still English-only: "${name}"`);
    failed += 1;
  }
}

if (failed) {
  console.error(`i18n demo catalog verify: ${failed} issue(s)`);
  process.exit(1);
}

console.log('i18n demo catalog verify: OK');