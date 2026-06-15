# 嘿市 HeyMarket MVP — React Native

React Native (Expo) port of `heishi_mvp_interactive_demo_merged_v5.html`.

## Overview

This folder contains a pixel-faithful React Native recreation of the HTML interactive demo, including:

- All 30 screens and navigation flows
- Matching colors, typography weights, spacing, and border radii from the HTML `:root` theme
- Bottom tab bar (首页 / 同城 / 发布 / 消息 / 我的)
- Product feed, detail pages, publish flows, settings, trust, chat, and admin preview
- Toast notifications and favorites state

## Design tokens (from HTML)

| Token | Value |
|-------|-------|
| Background | `#fbfaf6` |
| Brand | `#ffc400` / `#ff7a2f` |
| Screen padding | 14px |
| Bottom nav height | 78px |
| Status bar | 34px |
| Border radius (cards) | 22px |

## Internationalization (i18n)

English and Chinese are supported via `i18next` + `react-i18next`.

- Locale files: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`
- Change language: **Settings → Profile → Edit profile** (language toggle at bottom)
- Preference is saved with AsyncStorage and restored on launch
- Device locale is used on first launch (`zh*` → Chinese, otherwise English)

## Build APK

### Option A — Local build (Windows)

Requires JDK 17 + Android SDK (the script installs them under `.tools/` on first run):

```bash
npm run build:apk
```

Output: `dist/heishi-mvp-rn.apk`

If Gradle fails with `Remote host terminated the handshake`, dependency downloads are being blocked on your network. Try a VPN, corporate proxy settings, or Option B.

### Option B — Expo EAS cloud build (recommended if local Gradle fails)

```bash
npm install -g eas-cli
eas login
npm run build:apk:eas
```

`eas.json` is configured to produce an `.apk` (not AAB). Download the artifact from the Expo build page when complete.

## Run

```bash
cd heishi-mvp-rn
npm install
npm start
```

Then press `a` for Android, `i` for iOS simulator, or scan the QR code with Expo Go.

## Project structure

```
heishi-mvp-rn/
├── App.tsx                 # Root shell + screen router
├── src/
│   ├── theme.ts            # Colors, spacing, fonts
│   ├── types.ts            # Screen IDs, Product type
│   ├── data/products.ts    # Demo product data
│   ├── context/AppContext.tsx
│   ├── components/         # Shared UI building blocks
│   └── screens/            # One file group per feature area
```

## Parity checklist

- [x] Home feed with tabs, pills, categories, bundle card
- [x] Category / search / detail / bundle / intent / contact
- [x] Publish hub + bundle / product / service forms
- [x] Messages + chat
- [x] Profile + settings sub-pages
- [x] Trust, auth, safety, favorites, history, admin preview
- [x] Toast + back navigation + bottom nav hide on sub-screens

## Source

Original HTML demo: `../heishi_mvp_interactive_demo_merged_v5.html`
