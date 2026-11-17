---
name: monorepo-setup
description: >
  Configura el monorepo Turborepo + pnpm para la app Helu (Expo + Next.js + packages compartidos).
  Usar cuando se cree un nuevo package, se configure un workspace, se agregue una dependencia compartida,
  se configure TypeScript, o cuando haya problemas de resolución de módulos entre apps.
  También usar cuando se necesite agregar transpilePackages en Next.js o configurar Metro para el monorepo.
---

# Monorepo Setup — Helu

## Estructura esperada

```
frontend/
├── apps/
│   ├── mobile/        → Expo SDK 54 + React Navigation
│   └── web/           → Next.js 16 App Router
├── packages/
│   ├── ui/            → Componentes visuales compartidos (Shared Types Pattern)
│   ├── api/           → Axios + TanStack Query + Core Hooks + Schemas Zod
│   ├── stores/        → Estado global Zustand (auth, notificaciones)
│   └── config/        → Variables de entorno tipadas
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── docker-compose.yml
```

## Archivos raíz críticos

### pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "start": { "cache": false, "persistent": true },
    "lint": {},
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

### tsconfig.base.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true
  },
  "exclude": ["node_modules", "dist", ".next", ".turbo"]
}
```

> **Nota**: No se usan `paths` en tsconfig. La resolución ocurre vía pnpm workspace symlinks + conditional exports en package.json.

## Configuración por app

### apps/web — next.config.ts
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    "@helu/ui",
    "@helu/config",
    "@helu/api",
  ],
};
export default nextConfig;
```

### apps/mobile — metro.config.js
```js
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
module.exports = config;
```

> No se usa NativeWind ni Tailwind. Los estilos se manejan con `StyleSheet.create()` y tokens de `@helu/ui`.

## Resolución multiplataforma — Conditional Exports

El package `@helu/ui` usa conditional exports para servir código diferente a cada plataforma:

```json
// packages/ui/package.json
{
  "name": "@helu/ui",
  "exports": {
    ".": {
      "react-native": "./src/index.ts",
      "default": "./src/web.ts"
    },
    "./hooks": {
      "types": "./src/useDebounceSearch.ts",
      "default": "./src/useDebounceSearch.ts"
    }
  }
}
```

- **Metro** (mobile) → resuelve `react-native` condition → `index.ts` → exporta `*.native.tsx`
- **Next.js** (web) → resuelve `default` condition → `web.ts` → exporta `*.web.tsx`

## Estructura de cada package

### package.json mínimo
```json
{
  "name": "@helu/nombre",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### Para packages con sub-exports (ej: api)
```json
{
  "name": "@helu/api",
  "exports": {
    ".": "./src/index.ts",
    "./hooks": {
      "types": "./src/hooks.ts",
      "default": "./src/hooks.ts"
    }
  }
}
```

## Docker

```yaml
# docker-compose.yml
services:
  web:
    build:
      args:
        - APP_NAME=@helu/web
    container_name: helu_frontend_web

  mobile:
    build:
      args:
        - APP_NAME=@helu/mobile
    container_name: helu_frontend_mobile

networks:
  helu_network:
    external: false
```

## Reglas del monorepo

- Instalar dependencias nativas SOLO en `apps/mobile`, nunca en packages compartidos
- Dependencias JS puras van en el package que las usa o en la raíz si son dev tools
- Versiones de React y React Native deben ser idénticas (controladas por `pnpm.overrides` en la raíz)
- Nunca importar desde rutas relativas entre apps — usar siempre `@helu/nombre`
- Cada package debe exportar todo desde `src/index.ts`
- `packages/ui` tiene dual entry point: `index.ts` (mobile) y `web.ts` (web)

## Checklist al agregar un nuevo package

- [ ] Crear carpeta en `packages/`
- [ ] Agregar `package.json` con nombre `@helu/nombre`
- [ ] Crear `src/index.ts` con exports
- [ ] Agregar a `transpilePackages` en `next.config.ts` si tiene componentes React
- [ ] Agregar como dependencia `workspace:*` en las apps que lo consumen
- [ ] Ejecutar `pnpm install` para crear symlinks
