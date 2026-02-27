# Oliva App (Mobile Wrapper)

`oliva-app` is the mobile wrapper of Oliva Church built with Expo + React Native.

It loads the web app (`https://oliva.church/`) inside a `WebView`, keeps internal navigation in-app, and opens external links in the device browser.

## What this project does

- Renders Oliva web app inside native mobile shell.
- Preserves web session/storage (`domStorageEnabled`).
- Intercepts external URLs and opens them with `expo-linking`.
- Shows native loading and error/retry UI.

## Main files

- `App.tsx`: mobile wrapper runtime (WebView + navigation control + error flow).
- `storage.ts`: AsyncStorage manager helpers.
- `utils.ts`: domain/scheme validation helpers (`isOlivaDomain`, `isSecureScheme`, etc.).
- `types.ts`: app and WebView shared types.
- `app.json`: Expo metadata (name, bundle/package ids, icons).

## Requirements

- Node.js 20 (LTS)
- npm
- Expo CLI via `npx expo`

If you use nvm:

```bash
nvm use
```

## How to run

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm start
```

For Expo Go on physical devices (when LAN/QR does not connect), use:

```bash
npm run start:tunnel
```

3. Open target:

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web preview
- Or scan QR with Expo Go

## Useful commands

```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
```

## Local config

Use `.env.example` as reference for values such as:

- `OLIVA_BASE_URL`
- `OLIVA_DOMAIN`
- `USER_AGENT`
- `DEBUG_MODE`

## Notes

- Keep this app wrapper-focused; business logic stays in `oliva-front` and `oliva-back`.
- See `context.md` in this folder for coding conventions and architecture constraints.
- On web, the wrapper redirects to `https://oliva.church/` (WebView/iframe is mobile-focused).
