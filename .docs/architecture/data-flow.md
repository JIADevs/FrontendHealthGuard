# Flujo de datos

Cómo viaja un dato entre UI, `@helu/api`, el backend y de vuelta.

## Camino feliz

```text
Screen / Core hook
    → reactQueryHooks / endpoints
        → apiClient (Axios)
            → Bearer + X-Patient-Context?
            → body camelCase → snake_case
        ← response snake_case → camelCase
        ← Zod .parse (schemas)
    ← cache TanStack Query (QK)
Screen render
```

Archivos clave: `packages/api/src/client.ts`, `endpoints.ts`, `schemas.ts`, `reactQueryHooks.ts`.

## Cliente HTTP

| Concern | Comportamiento |
|---------|----------------|
| Base URL | `${getApiUrl()}/api/v1` (`@helu/config`) |
| Auth DI | `setApiAuthProviders({ getToken, getRefreshToken, getPatientContext, setAuth, clearAuth })` |
| Mobile | Providers cableados en `apps/mobile/App.tsx` |
| Web | Si no hay providers, lee persist `auth-store` de `localStorage` |
| 401 | Cola de refresh → `POST /auth/refresh` → reintento; si falla, `clearAuth` / redirect login |
| Skip refresh | Paths `/auth/login`, `/auth/signup` |
| Skip contexto | `HeluRequestConfig.skipPatientContext` (device tokens, prefs de color de delegación) |

## Auth de punta a punta

| Paso | Dónde |
|------|-------|
| Login / signup | Screens → `login`/`signup` → `setAuth(access, refresh)` |
| Persist | Zustand `auth-store` (tokens + user; **no** `activePatientId`) |
| Request | Bearer + opcional `X-Patient-Context` desde `activePatientId` |
| Logout | Clear store + QueryClient; mobile desregistra push antes |

## Cores de formulario

Los `use*FormCore` / `use*Core` en `packages/api` encapsulan estado de formulario + mutaciones. Las apps envuelven (p. ej. `apps/mobile/src/hooks/useDocumentForm.ts`, `apps/web/src/hooks/useAppointmentForm.ts`) para toasts y navegación.

## Feedback de mutaciones

La skill `frontend-mutation-feedback` exige loading + toast éxito/error. Los hooks de Query suelen invalidar en `onSettled`; el toast lo pone el caller de la app.

## Lectura siguiente

- [state.md](./state.md)
- [packages/api.md](./packages/api.md)
- Auth backend: `BackendHealthGuard/.docs/architecture/backend.md`
