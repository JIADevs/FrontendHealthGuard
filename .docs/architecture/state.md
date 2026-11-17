# Estado

Dos mundos: **estado de servidor** (TanStack Query) y **estado de cliente** (Zustand).

## Regla rápida

| Dato | Dónde |
|------|-------|
| Listas y detalle del API | TanStack Query (`@helu/api/hooks`) |
| Tokens, user, patient context | `useAuthStore` |
| Theme / sidebar | `useUiStore` |
| Contador unread | `useNotifStore` (memoria) |
| Borradores de formulario | Cores en `@helu/api` + estado local del screen |

## TanStack Query

- Keys centralizadas en `QK` (`reactQueryHooks.ts`).
- Listas: `staleTime` típico 5 min; `keepPreviousData` donde aplica.
- Mutaciones invalidan queries relacionadas en `onSettled`.
- Mobile: cleaner de cache al cambiar contexto de paciente (`setQueryCacheCleaner` en `App.tsx`).

## Zustand (`packages/stores`)

| Store | Persist key | Qué persiste |
|-------|-------------|--------------|
| `useAuthStore` | `auth-store` | `token`, `refreshToken`, `user` |
| `useUiStore` | `ui-store` | `theme`, `sidebarOpen` |
| `useNotifStore` | — | Solo `unreadCount` en memoria |

`activePatientId` / `isManaging` **no** se persisten: al frío de arranque el contexto vuelve al paciente propio.

## Persistencia de storage

`persistStorage.ts` + `setStoreStorage(adapter)`:

| Plataforma | Adaptador |
|------------|-----------|
| Mobile | AsyncStorage (`apps/mobile/src/bootstrapStorage.ts`) |
| Web | `localStorage` por defecto |
| Fallback | Map in-memory |

**No hay MMKV** en este repo, pese a lo que diga la skill `store-creation`.

## Lectura siguiente

- [data-flow.md](./data-flow.md)
- [packages/stores.md](./packages/stores.md)
