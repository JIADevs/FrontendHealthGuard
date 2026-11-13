# Arquitectura

Cómo está construido el frontend hoy. Describe el código tal como existe; el estado objetivo, si difiere, se registra como ADR en [`adr/`](./adr/README.md).

## Documentos transversales

| Documento | Contenido |
|-----------|-----------|
| [overview.md](./overview.md) | Monorepo, reglas de dependencia, drift vs skills |
| [data-flow.md](./data-flow.md) | Axios + Zod + Query, auth, patient context |
| [state.md](./state.md) | Query vs Zustand, persistencia |
| [navigation.md](./navigation.md) | React Navigation y App Router |
| [cross-platform.md](./cross-platform.md) | Splits native/web |
| [design-system.md](./design-system.md) | Capas de UI y tokens |

## Paquetes

| Documento | Paquete |
|-----------|---------|
| [packages/api.md](./packages/api.md) | `@helu/api` |
| [packages/ui.md](./packages/ui.md) | `@helu/ui` |
| [packages/stores.md](./packages/stores.md) | `@helu/stores` |
| [packages/config.md](./packages/config.md) | `@helu/config` |

## Apps

| Documento | App |
|-----------|-----|
| [apps/mobile.md](./apps/mobile.md) | `@helu/mobile` |
| [apps/web.md](./apps/web.md) | `@helu/web` |
