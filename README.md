# Helu — Frontend

> Monorepo con Turborepo + pnpm. Web (Next.js) y Mobile (Expo/React Native).

## Requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Docker** (para desarrollo con contenedores)

## Setup

```bash
pnpm install
```

## Desarrollo

### Con Docker (recomendado)

```bash
docker compose up --build
```

Levanta ambos servicios:
- **Web** → `http://localhost:3000`
- **Mobile** → Expo en `http://localhost:8081` (escanear QR con Expo Go)

### Sin Docker

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
│   ├── web/                  ← Next.js 15 (App Router)
│   └── mobile/               ← Expo / React Native
├── packages/
│   ├── api/                  ← Axios client, Zod schemas, endpoints
│   ├── config/               ← Variables de entorno compartidas
│   ├── stores/               ← Zustand (auth, UI, notificaciones)
│   └── ui/                   ← Design system compartido (tokens, primitives, forms)
├── .agent/                   ← Skills de desarrollo (convenciones, patrones)
├── docker-compose.yml        ← Web + Mobile en contenedores
├── turbo.json                ← Pipeline de Turborepo
├── pnpm-workspace.yaml       ← Workspace config
└── tsconfig.base.json        ← TypeScript compartido
```

## Packages

| Package | Descripción |
|---|---|
| `@helu/web` | App web — Next.js con App Router |
| `@helu/mobile` | App móvil — Expo / React Native |
| `@helu/api` | Cliente HTTP (Axios), schemas Zod, funciones de endpoint |
| `@helu/config` | `env.API_URL` y configuración compartida |
| `@helu/stores` | Stores Zustand: auth (token + refresh + delegación), UI (tema), notificaciones |
| `@helu/ui` | Design system: tokens, paleta semántica, primitivos, formularios, dark mode |

## Design System (`@helu/ui`)

El paquete `ui` sigue una estructura **Flat Groups**:

```
packages/ui/src/
├── tokens/          ← colors, palette, spacing, radii, shadows, theme, cssVariables
├── primitives/      ← Typography, Spinner, Chip, Pagination, EmptyState, Modal
├── forms/           ← Button, TextField, Select, DatePicker, ConfirmModal
└── utils/           ← formatDate, formatFileSize, timeAgo
```

- **Multiplataforma:** Cada componente tiene `.native.tsx` (React Native) y `.web.tsx` (HTML/CSS).
- **Dark mode:** Toggle manual (Claro / Oscuro / Sistema) en Perfil, persistido en `uiStore`.
- **Paleta semántica:** Siempre usar `palette.brand[500]` en vez de hex literales.

## Variables de entorno

Crear `apps/web/.env.local`:

```env
# Preferir 127.0.0.1 en Windows + Docker (localhost puede resolver a ::1)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Usuarios seed

| Nombre | Email | Rol |
|---|---|---|
| Alejandra Gómez | `alejandra@helu.dev` | Paciente |
| Juan Camilo Randazzo | `juan@helu.dev` | Paciente (dependiente) |
| Carlos Manager | `manager@helu.dev` | Manager de Juan |

> **Contraseña para todos:** `Seed1234!`

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Web:** Next.js 15, React 19, TypeScript 5
- **Mobile:** Expo SDK, React Native
- **Estado:** Zustand (global) + TanStack Query (server state)
- **HTTP:** Axios con auto-refresh de JWT y delegación (`X-Patient-Context`)
- **Validación:** Zod (schemas espejo de Pydantic del backend)
- **Iconos:** Lucide React / Lucide React Native
- **Design System:** Tokens + componentes compartidos con soporte dark mode
