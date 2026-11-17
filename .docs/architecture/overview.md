# Overview — monorepo frontend

Turborepo + pnpm. Packages internos `@helu/*`. Apps: mobile (Expo) y web (Next.js App Router).

## Mapa

```text
apps/mobile (@helu/mobile) ──┐
apps/web    (@helu/web)    ──┼──► @helu/ui ──► @helu/api ──► @helu/config
                             │         │            │
                             │         │            └──► @helu/stores (import en source)
                             └─────────┴──► @helu/stores
                             └──────────────► @helu/config
```

| Pieza | Path | Rol |
|-------|------|-----|
| Mobile | `apps/mobile` | UX principal; React Navigation |
| Web | `apps/web` | Subconjunto de pantallas + share público |
| API client | `packages/api` | Axios, Zod, TanStack Query, form cores |
| UI | `packages/ui` | Primitives → forms → containers → composed + tokens |
| Stores | `packages/stores` | Auth, UI theme, unread count |
| Config | `packages/config` | Resolución de `API_URL` |

**No existe** `packages/features` / `@helu/features`. La lógica de formularios y dashboards vive en `packages/api` (`use*Core.ts`).

## Reglas de dependencia

1. Apps importan packages; packages no importan apps.
2. `@helu/config` y `@helu/stores` son hojas (stores no declara deps workspace).
3. `@helu/api` depende de `@helu/config`; en código también lee `@helu/stores` (hoy **no** declarado en su `package.json` — drift).
4. `@helu/ui` puede usar `@helu/api` (calendario / hooks).
5. Web transpila `@helu/ui`, `@helu/config`, `@helu/api` (`next.config.ts`); stores se consume vía bundle de la app.

## Workspace

- `pnpm-workspace.yaml`: `apps/*`, `packages/*`
- `turbo.json`: `dev`, `start`, `build`, `lint`, `clean`
- Root scripts: `dev:web`, `dev:mobile`, `docker:dev`

## Drift vs skills

| Skill / expectativa | Código |
|---------------------|--------|
| `packages/features` | Ausente → cores en `@helu/api` |
| Expo Router | Mobile usa **React Navigation** |
| Persistencia MMKV | **AsyncStorage** (mobile) + **localStorage** (web) |

Si skill ≠ código: manda el código y se reporta el desajuste (ver `AGENTS.md`).

## Lectura siguiente

- [data-flow.md](./data-flow.md)
- [state.md](./state.md)
- [packages/api.md](./packages/api.md)
- Producto/features: `BackendHealthGuard/.docs/`
