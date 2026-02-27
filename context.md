# oliva-app Context

## Purpose

`oliva-app` is the Expo/React Native mobile wrapper for Oliva Church web experience.

## Main Files and Entry Points

- `App.tsx`: WebView host, loading/error UX, external link handling.
- `app.json`: Expo app configuration.
- `storage.ts`: AsyncStorage helper for local persistence utilities.
- `utils.ts` and `types.ts`: URL/security helpers and shared types.
- `scripts/validate.js`: quick setup/config validation script.

## Architecture and Patterns

- Wrapper-first architecture: load `https://oliva.church/` and keep mobile shell minimal.
- Domain allowlist checks decide in-WebView navigation vs native browser handoff.
- Web app owns authentication/business rules; wrapper provides mobile UX glue only.

## Domain Concepts and Business Rules

- Internal Oliva domain stays in WebView.
- External links open with native browser (`expo-linking`).
- Session persistence is expected via WebView storage (`domStorageEnabled`) and web app tokens.
- `userAgent` should remain explicitly configured (`OlivaChurchApp/1.0`) unless coordinated with backend.
- Allowed domain pattern is `oliva.church` and subdomains; unknown domains must not stay in-app.

## Interactions and Dependencies

- Depends on `react-native-webview`, `expo-linking`, and AsyncStorage.
- Relies on web app/backend auth and business logic.
- Optional future native capabilities (camera/push/deep link) should be introduced behind clear scope changes.

## Conventions for New Code

### Do
- Keep native code focused on wrapper concerns (navigation, resilience, UX glue).
- Centralize URL safety logic in `utils.ts` (`isOlivaDomain`, `isSecureScheme`, `isSpecialScheme`).
- Keep persistence helpers in `storage.ts` (avoid scattered AsyncStorage calls).
- Use typed interfaces from `types.ts` for WebView events/messages.
- Prefer secure defaults: HTTPS base URL in production and explicit error/reload behavior.

### Don’t
- Don’t duplicate frontend business workflows natively unless explicitly required.
- Don’t hardcode secrets, JWTs, or credentials in app code.
- Don’t bypass external-link interception for non-Oliva domains.
- Don’t add heavy UI feature logic in wrapper layer when it belongs to web app.
- Don’t change package/bundle identifiers or production URL conventions without release coordination.

## Validation Checklist for Changes

- Run `npm start` and verify loading + navigation flows.
- Verify internal routes stay in WebView and external links open system browser.
- Test error/retry flow by simulating network failure.
- Run `npm run lint` and keep TypeScript-compatible updates.

## Acceptance Criteria

- Wrapper changes stay focused on WebView shell concerns (navigation, resilience, external-link handling).
- Unknown/non-Oliva domains never remain inside in-app WebView.
- Failure-path behavior (network error and retry) remains available and testable.

## Validation Commands

- `npm run lint`
- `npm start` (manual validation for navigation and external links)

## Metadata

- Owner: Mobile wrapper team
- Last Reviewed: 2026-02-26
- Status: Active
