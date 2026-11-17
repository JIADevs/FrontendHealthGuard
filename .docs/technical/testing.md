# Testing — frontend

## Estado actual

El monorepo **no** declara un runner de tests de producto en los `package.json` raíz / apps / packages (sin Jest/Vitest de suite de features en los scripts revisados). La verificación diaria se apoya en:

- `pnpm lint`
- `pnpm build`
- Pruebas manuales en simulador / navegador
- Specs de cambio en `openspec/` + verify reports

## Cuando se agregue un runner

1. Documentar el comando canónico acá.
2. Actualizar `AGENTS.md`.
3. Preferir tests de cores/hooks en `packages/api` cerca del contrato Zod.

## Lectura siguiente

- Backend testing (sí hay pytest): `BackendHealthGuard/.docs/technical/testing.md`
