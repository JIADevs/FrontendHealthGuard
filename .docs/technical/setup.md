# Setup — frontend

## Requisitos

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (opcional, `pnpm docker:dev`)

## Quick path

```bash
pnpm install
pnpm dev:web      # Next.js
pnpm dev:mobile   # Expo
```

Variables típicas: `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL` apuntando al backend (`http://127.0.0.1:8000` en local). Detalle de resolución: [packages/config.md](../architecture/packages/config.md).

## Docker

- `Dockerfile` (turbo prune; targets web standalone, web-dev, mobile-runner)
- `docker-compose.yml` + `docker-up.js`
- Script root: `pnpm docker:dev`

## Monorepo

| Comando | Efecto |
|---------|--------|
| `pnpm lint` | Turbo lint |
| `pnpm build` | Turbo build |
| `pnpm clean` | Limpieza |

## Lectura siguiente

- [build-release.md](./build-release.md)
- [troubleshooting.md](./troubleshooting.md)
