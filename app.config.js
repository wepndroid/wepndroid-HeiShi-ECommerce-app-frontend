const base = require('./app.json').expo;

// Set EXPO_PUBLIC_APP_LINK_ORIGIN to the production HTTPS origin. Keeping it
// unset preserves local/LDPlayer builds without claiming a development host.
const configuredOrigin = (process.env.EXPO_PUBLIC_APP_LINK_ORIGIN || '').trim();
let appLinkDomain = '';
if (configuredOrigin) {
  const origin = new URL(configuredOrigin);
  if (
    origin.protocol !== 'https:'
    || origin.port
    || origin.pathname !== '/'
    || origin.search
    || origin.hash
  ) {
    throw new Error('EXPO_PUBLIC_APP_LINK_ORIGIN must be an HTTPS origin without a path');
  }
  appLinkDomain = origin.hostname;
}

module.exports = {
  expo: {
    ...base,
    android: {
      ...base.android,
      ...(appLinkDomain
        ? {
            intentFilters: [
              {
                action: 'VIEW',
                autoVerify: true,
                data: [{ scheme: 'https', host: appLinkDomain, pathPrefix: '/s/' }],
                category: ['BROWSABLE', 'DEFAULT'],
              },
            ],
          }
        : {}),
    },
    ios: {
      ...base.ios,
      ...(appLinkDomain ? { associatedDomains: [`applinks:${appLinkDomain}`] } : {}),
    },
  },
};
