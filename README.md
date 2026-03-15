# HealthGuard — Frontend

> Monorepo con Turborepo + pnpm. Web (Next.js) y Mobile (Expo) — próximamente.

## Requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)

## Setup

```bash
pnpm install
```

## Desarrollo

```bash
# Web (Next.js en http://localhost:3000)
pnpm dev:web

# Todos los apps en paralelo
pnpm dev
```

## Build

```bash
pnpm build
```

## Estructura

```
frontend/
├── apps/
│   └── web/                  ← Next.js 16 (App Router)
├── packages/
│   ├── api/                  ← Axios client, Zod schemas, endpoints
│   ├── config/               ← Variables de entorno compartidas
│   └── stores/               ← Zustand (auth, UI, notificaciones)
├── turbo.json                ← Pipeline de Turborepo
├── pnpm-workspace.yaml       ← Workspace config
└── tsconfig.base.json        ← TypeScript compartido
```

## Packages

| Package | Descripción |
|---|---|
| `@healthguard/web` | App web — Next.js con App Router |
| `@healthguard/api` | Cliente HTTP (Axios), schemas Zod, funciones de endpoint |
| `@healthguard/config` | `env.API_URL` y configuración compartida |
| `@healthguard/stores` | Stores Zustand: auth (token + refresh + delegación), UI, notificaciones |

## Variables de entorno

Crear `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Web:** Next.js 16, React 19, TypeScript 5
- **Estado:** Zustand (global) + TanStack Query (server state)
- **HTTP:** Axios con auto-refresh de JWT y delegación (`X-Patient-Context`)
- **Validación:** Zod (schemas espejo de Pydantic del backend)
- **Iconos:** Lucide React
