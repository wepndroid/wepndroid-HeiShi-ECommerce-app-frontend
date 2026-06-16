export default {
  testDir: '.',
  testMatch: 'prog105-ui.spec.mjs',
  timeout: 60000,
  use: {
    headless: true,
    viewport: { width: 390, height: 844 },
  },
};
