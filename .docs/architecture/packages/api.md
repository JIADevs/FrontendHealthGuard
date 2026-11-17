# Package `@helu/api`

Cliente HTTP, contratos Zod, hooks de TanStack Query y cores de formularios/feature.

## Entradas públicas

| Export | Contenido |
|--------|-----------|
| `@helu/api` | client, errors, schemas, endpoints, shares |
| `@helu/api/hooks` / `@helu/api/reactQueryHooks` | Query/mutation hooks + reexport de cores |

## Módulos

| Archivo | Rol |
|---------|-----|
| `client.ts` | Axios, interceptors, auth DI, case conversion |
| `endpoints.ts` | Funciones por dominio (auth, users, docs, agenda, meds, …) |
| `shares/` | Endpoints + schemas de shares unificados |
| `schemas.ts` | Zod + `createPageSchema` |
| `reactQueryHooks.ts` | `QK`, queries, mutations, invalidación |
| `use*Core.ts` | Document, profile, backpack, medication, treatment, appointment, agenda task, doctor, notifications, dashboard |
| `use*Infinite*.ts` | Listas infinitas (backpack docs, check-ins) |

## Dominios cubiertos en endpoints

Auth, users/preferences, documents (+ classify/tags/share), appointments, agenda tasks, treatments, medications/cycles/intakes, doctors, notifications (+ device token), calendar events, daily check-ins, backpacks, delegations, shares.

## Dependencias

- Declared: `@helu/config`, peer `@tanstack/react-query`.
- En source también: `@helu/stores` (hooks de dashboard/auth-aware) — **falta en package.json**.

## Reglas

1. Toda respuesta de red que se use en UI se valida con Zod.
2. No meter navegación ni toasts de plataforma dentro del package (van en la app).
3. Nuevos recursos: schema → endpoint → hook → (opcional) core.

## Lectura siguiente

- [data-flow.md](../data-flow.md)
- Skills: `api-integration`, `backend-contract`
