# Package `@helu/stores`

Estado de cliente con Zustand.

## Stores

| Store | Archivo | Persist |
|-------|---------|---------|
| `useAuthStore` | `authStore.ts` | `auth-store` (tokens + user) |
| `useUiStore` | `uiStore.ts` | `ui-store` (theme, sidebar) |
| `useNotifStore` | `notifStore.ts` | No |

API de auth relevante: `setAuth`, `logout`, `setPatientContext` / `switchPatientContext`, `setQueryCacheCleaner`, flag `isHydrated`.

## Storage

`persistStorage.ts` + `setStoreStorage`. Mobile inyecta AsyncStorage en bootstrap. Web usa localStorage.

## Reglas

1. No guardar en Zustand datos que ya viven en Query (listas del API).
2. No persistir `activePatientId` (comportamiento actual a preservar salvo ADR).
3. Tokens hoy van en storage no cifrado (AsyncStorage/localStorage); no asumir SecureStore.

## Lectura siguiente

- [state.md](../state.md)
- Skill: `store-creation` (ignorar MMKV hasta que exista en el repo)
