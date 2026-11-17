# 0001 — Documentar el código tal como es

- Estado: aceptada
- Fecha: 2026-11-12

## Contexto

Las skills del frontend describen un estado objetivo (`packages/features`, Expo Router, MMKV) que no coincide con el monorepo actual. Mezclar “cómo debería ser” con “cómo es” engaña a agentes y a personas.

## Decisión

Los documentos bajo `.docs/architecture/` describen el código existente. El estado objetivo se registra como ADR separado o se corrige la skill; no se reescribe la arquitectura como si el target ya existiera.

## Consecuencias

- Drift explícito en `AGENTS.md` y en overview.
- Extraer `packages/features` o migrar a Expo Router requiere ADR nuevo + cambio de código + actualización de docs.
