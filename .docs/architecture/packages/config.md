# Package `@helu/config`

Resolución de URL del API y URL pública web.

## `getApiUrl()` — orden

1. Valor runtime (`setRuntimeApiUrl`, mobile bootstrap)
2. Expo `extra.apiUrl` / `extra.API_URL` (solo native vía `expo-constants`)
3. `process.env.EXPO_PUBLIC_API_URL`
4. `process.env.NEXT_PUBLIC_API_URL`
5. Fallback `http://127.0.0.1:8000`

También: `env.WEB_APP_PUBLIC_URL` desde `EXPO_PUBLIC_WEB_APP_URL` | `NEXT_PUBLIC_WEB_APP_URL`.

## Mobile

`apps/mobile/src/bootstrapEnv.ts` ajusta host en `__DEV__` (emulador Android `10.0.2.2`, simulador iOS `127.0.0.1`). `app.config.js` inyecta `extra.apiUrl`.

## Lectura siguiente

- [overview.md](../overview.md)
- [technical/setup.md](../../technical/setup.md)
