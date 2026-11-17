# Build y release — frontend

## Web

```bash
pnpm build --filter=@helu/web
```

Next.js standalone (también usado en targets Docker del `Dockerfile`).

## Mobile (EAS)

Config: `apps/mobile/eas.json`, `app.config.js`, `app.json`.

| Perfil | Notas |
|--------|-------|
| preview / production | APK; inyecta `EXPO_PUBLIC_API_URL` |

Scripts en `apps/mobile`: `build:apk`, `build:apk:local`.

Checklist:

- [ ] `extra.apiUrl` / env de API del entorno correcto
- [ ] `google-services.json` presente para FCM Android
- [ ] Credenciales APNs alineadas con el backend

## Lectura siguiente

- [apps/mobile.md](../architecture/apps/mobile.md)
- [setup.md](./setup.md)
