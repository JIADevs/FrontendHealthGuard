# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Frontend monorepo for **Helu**, a Spanish-language (Colombia) health-management app: medical documents, agenda (appointments, medications, treatments, daily check-ins), "mochilas" (backpacks of documents), secure sharing via link/QR, and delegated care (a manager acting on behalf of a dependent patient). Turborepo + pnpm workspaces, with two apps sharing four packages:

- `apps/web` (`@helu/web`): Next.js 16 App Router, React 19.2
- `apps/mobile` (`@helu/mobile`): Expo SDK 54, React Native 0.81, React Navigation 7 (not Expo Router)
- `packages/api`, `packages/ui`, `packages/stores`, `packages/config` (`@helu/*`), consumed as TypeScript source (no build step)

The backend is a separate FastAPI repo at `../BackendHealthGuard`; the marketing site is `../helu-landing-page`. Each is its own git repository.

## Commands

Run from the repo root.

```bash
pnpm install
pnpm dev:web                 # Next.js on http://localhost:3000
pnpm dev:mobile              # expo start (scan QR with Expo Go)
pnpm dev                     # all apps in parallel via turbo
pnpm build                   # turbo build (only apps/web has a real build)
docker compose up --build    # web (3000) + mobile Metro (8081) in containers
node docker-up.js            # wrapper that sets HOST_IP to the LAN IP; `--clear` reinstalls deps
```

Type-check (there is no test runner and no lint configuration; `turbo lint` does nothing useful):

```bash
pnpm exec tsc --noEmit -p apps/mobile    # the verify command used by openspec
pnpm --filter @helu/web build            # type-checks web as part of next build
```

Mobile APK builds: `pnpm --filter @helu/mobile build:apk` (EAS, `preview` profile).

The app needs the backend running on port 8000. Web reads `NEXT_PUBLIC_API_URL` (put it in `apps/web/.env.local`; use `127.0.0.1`, not `localhost`, on Windows + Docker because `localhost` can resolve to `::1`). Mobile reads `expo.extra` or `EXPO_PUBLIC_API_URL`; on a physical phone it must be the host's LAN IP. Seed users (from the backend seeder): `alejandra@helu.dev`, `juan@helu.dev` (dependent), `manager@helu.dev` (Juan's manager), password `Seed1234!`.

## Architecture

### Where logic lives

Business logic is shared; apps only add presentation and platform effects.

- **`@helu/api`** holds everything server-related: the Axios client, Zod schemas (mirrors of the backend's Pydantic models, in `schemas.ts`), endpoint functions (`endpoints.ts`, `shares/`), and TanStack Query hooks exported from `@helu/api/hooks`.
- Form and screen logic lives in `*Core` hooks in `packages/api/src/` (`useMedicationFormCore`, `useDocumentFormCore`, `useDashboardCore`, ...). They take an `adapters` object for side effects. Each app wraps them thinly: web hooks in `apps/web/src/hooks/` plug in `sileo` toasts; mobile plugs in `react-native-toast-message` and navigation. When adding a feature, extend or add a `*Core` hook first, then the app wrappers.
- **`@helu/stores`** (Zustand): `authStore` (token, refresh token, `activePatientId` for delegation), `uiStore` (theme preference), `notifStore`. Server data goes in TanStack Query, never in Zustand.
- **`@helu/config`**: `getApiUrl()` / `env`, resolving Expo extra, `EXPO_PUBLIC_*`, `NEXT_PUBLIC_*`, then `http://127.0.0.1:8000`.

### API client and delegation

`packages/api/src/client.ts` uses dependency injection: apps call `setApiAuthProviders({ getToken, getRefreshToken, getPatientContext, setAuth, clearAuth })` (mobile does this in `App.tsx`). Without providers (web), it falls back to reading the persisted Zustand `auth-store` key from `localStorage`. Requests get `Authorization: Bearer` plus `X-Patient-Context: <activePatientId>` when a manager is operating as a dependent; manager-only endpoints opt out with `skipPatientContext`. The client also auto-refreshes on 401 and converts snake_case responses to camelCase. Errors are normalized to `ApiError` (`isApiError`), and both apps' QueryClients skip retries on 4xx. When the active patient changes, mobile invalidates a fixed list of patient-scoped query roots (`PATIENT_SCOPED_QUERY_ROOTS` in `apps/mobile/App.tsx`): add new patient-scoped query keys there.

### Design system (`@helu/ui`)

- Tokens are the single source of truth for both platforms: `src/tokens/tokens.ts` (raw scales plus the 3-level `palette`: `brand`, `status`, `accent` per feature) and `theme.ts` (`lightTheme` / `darkTheme`). Use `palette.*` and theme values, never hex literals.
- Each component has `Name.types.ts`, `Name.native.tsx` and `Name.web.tsx`. There are two entry points selected by package `exports` conditions: `src/index.ts` (`react-native` condition, exports `.native`) and `src/web.ts` (default, exports `.web`). **A new component must be exported from both files.** Web components are plain React with inline styles; native ones use `StyleSheet` / `useAppTheme()`.
- Dark mode: on mobile, `ThemeProvider` / `useAppTheme()`. On web, `generateCssVariables()` is injected as a `<style>` in `apps/web/src/app/layout.tsx`, producing `--brand-*`, `--bg-*`, `--text-*`, `--accent-*` variables with a `[data-theme="dark"]` block and a `prefers-color-scheme` fallback. Web page CSS (`globals.css` and the per-route `*.css` files) must use those variables.

### Apps

- **Web**: authenticated pages in `src/app/(app)/` (dashboard, agenda, documents, backpacks, treatments, share, profile, settings) with a sidebar layout; page-local components go in `_components/`. Public routes: `login`, `signup`, `share/doc`. `next.config.ts` pins `turbopack.root` to the monorepo root and lists the workspace packages in `transpilePackages` (required so `NEXT_PUBLIC_*` gets inlined into `@helu/config`).
- **Mobile**: `App.tsx` sets up providers, then `src/navigation/RootNavigator.tsx` and `TabNavigator.tsx` (tabs: Documents, Agenda, Home, Backpacks, More). Screens live in `src/screens/`; feature UI goes in `src/components/{module}/` (agenda, documents, backpacks, share, home, dependientes, more). Push notifications route through `src/navigation/notificationRouting.ts`. `metro.config.js` watches only the four shared packages (watching more causes ENOMEM) and pins native packages to the hoisted copies; `.npmrc` uses `shamefully-hoist=true`.

## OpenSpec workflow

Changes are spec-driven under `openspec/` (`specs/mobile`, `specs/shared-api`; proposals in `changes/`). From `openspec/config.yaml`:

- Scope is **mobile-first**; `apps/web` is out of scope unless explicitly requested (tag such tasks `[web-deferred]`).
- Order of work: `packages/api` → `apps/mobile/src/components/{module}/` → mobile screens. Screens only wire props and callbacks; every UI fix lands as a module component.
- Promote a component to `packages/ui` only when a second feature needs it.
- Specs use Given/When/Then with RFC 2119 keywords.

## Gotchas

- Many files have macOS-style duplicates with a ` 2` suffix (`HomeScreen 2.tsx`, `delegationUtils 2.ts`, `treatments 2.css`, ...). They are stale copies and are not imported; edit the file without the suffix.
- Development skills adapted to this code live in `../.claude/skills/` (frontend: `code-conventions`, `component-creation`, `platform-component`, `feature-module`, `api-integration`, `store-creation`, `navigation-setup`, `monorepo-setup`, `realtime-integration`; cross-repo: `backend-*`). The originals in `../.cursor/skills/` (the `.agent/` of the README) describe an aspirational "Antigravity" stack (NativeWind, CVA, Expo Router, `@repo/*`, MMKV) that does **not** match this code; ignore them.
- `metro.config.js` `extraNodeModules` still maps old `@healthguard/*` names; the real packages are `@helu/*` and resolve through the workspace.
- UI copy is Spanish (Colombia); keep new strings in Spanish.
- Target UI (redesign B) lives in `.docs/design/`: design system in `.docs/design/system/MASTER.md` (tokens, components, forms, motion) and HTML mockups of every screen in `.docs/design/mockups/`. New UI follows it; the code-vs-target gap is in ADR 0002.
