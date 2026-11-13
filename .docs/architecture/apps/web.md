# App `@helu/web`

Next.js App Router. Subconjunto de la UX mobile + página pública de share.

## Stack local

- `src/app/` — rutas
- `src/components/` — UI de la app
- `src/hooks/` — wrappers de cores
- `providers.tsx` — solo `QueryClientProvider`
- Auth HTTP: fallback de `client.ts` leyendo `auth-store` en localStorage (no llama `setApiAuthProviders`)

## Rutas implementadas

| Ruta | Notas |
|------|-------|
| `/login`, `/signup` | Auth |
| `/(app)/dashboard` | `useDashboardCore` |
| `/(app)/documents` | CRUD + modales upload/share/detail |
| `/(app)/agenda` | Citas + medicamentos (sin calendario/bienestar) |
| `/(app)/treatments`, `/backpacks`, `/share`, `/profile` | OK |
| `/(app)/settings` | Theme; resto pendiente de copy |
| `/share/doc` | Token público |

## Limitaciones conscientes

- Sin push.
- Sin paridad de Agenda mobile.
- Settings incompleto.
- Transpile packages: `@helu/ui`, `@helu/config`, `@helu/api` (stores vía app).

## Lectura siguiente

- [navigation.md](../navigation.md)
- [technical/setup.md](../../technical/setup.md)
