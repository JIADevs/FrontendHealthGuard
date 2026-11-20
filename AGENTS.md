# AGENTS.md — Helu Frontend

Helu frontend monorepo (Turborepo + pnpm). Packages are published internally as `@helu/*`.

| Path | What it is |
|------|------------|
| `apps/mobile` | Expo / React Native app. Navigation: React Navigation (`src/navigation`) |
| `apps/web` | Next.js app (App Router, `src/app`) |
| `packages/api` | HTTP client, endpoints, Zod schemas, TanStack Query hooks, form/business hooks |
| `packages/ui` | Shared components (`primitives`, `composed`, `forms`, `containers`, `platform`) and tokens |
| `packages/stores` | Zustand stores (auth, notifications, UI) |
| `packages/config` | Environment config per platform |

## Documentation

- Frontend architecture: `.docs/` (start at `.docs/README.md`).
- Design system and mockups (target UI, redesign B, version 2): `.docs/design/` (start at `.docs/design/README.md`; global rules in `.docs/design/system/MASTER.md`; per-module and web rules in `.docs/design/system/pages/`, including `web.md` for `apps/web`; every design change is logged in `.docs/design/CHANGELOG.md`). The gap between current code and the target is tracked in `.docs/architecture/adr/0002-adopt-design-system-b.md`.
- Product, features, and system architecture: `BackendHealthGuard/.docs/`. Before working on a module, read its folder in `BackendHealthGuard/.docs/features/<feature>/`.
- When a change is archived in `openspec/`, update the affected `.docs/` files.

## Commands

```bash
pnpm install
pnpm dev:web       # Next.js
pnpm dev:mobile    # Expo
pnpm lint
pnpm build
pnpm docker:dev    # Full stack with Docker
```

## Skills

Read the matching skill in `.agents/skills/<name>/SKILL.md` before working on the task.

| Task | Skill |
|------|-------|
| Any new code, code review, naming, file placement | `code-conventions` |
| Shared UI component or variant in `packages/ui` | `component-creation` |
| Colors, typography, spacing, tokens | `design-system` (+ `.docs/design/system/`) |
| Component with different mobile/web implementation | `platform-component` |
| Business module (appointments, medications, records…) | `feature-module` |
| New endpoint, Axios client, Zod validation, Query hooks | `api-integration` |
| Mapping backend Pydantic schemas to Zod, HTTP errors | `backend-contract` |
| Login, signup, token refresh, logout, patient-context delegation | `backend-auth-flow` |
| Mutation loading state and success/error feedback | `frontend-mutation-feedback` |
| Global state with Zustand and persistence | `store-creation` |
| Screens, routes, deep links, tabs and stacks | `navigation-setup` |
| WebSockets, push notifications, notification center | `realtime-integration` |
| Workspace packages, shared deps, TypeScript, NativeWind/Tailwind | `monorepo-setup` |

## Known drift between skills and code

When a skill contradicts the code, follow the code and flag the mismatch to the user.

- `feature-module` and `api-integration` reference `packages/features` (`@helu/features`); it does not exist. Business and form hooks live in `packages/api`.
- `navigation-setup` describes Expo Router; mobile uses React Navigation.
