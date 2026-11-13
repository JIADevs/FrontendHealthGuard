# Troubleshooting — frontend

## API URL incorrecta en emulador

**Síntoma:** mobile no alcanza al backend en `localhost`.

**Qué hacer:** `bootstrapEnv.ts` debe remapear en `__DEV__` (`10.0.2.2` Android, `127.0.0.1` iOS). Revisar `EXPO_PUBLIC_API_URL` / `extra.apiUrl`.

## 401 en loop / logout inesperado

**Síntoma:** cada request limpia sesión.

**Qué hacer:** verificar refresh token vigente; interceptor en `client.ts`; que login no dispare refresh. En web, confirmar que existe `auth-store` en localStorage tras login.

## Push no registra en Expo Go

**Esperado:** `usePushNotifications` omite registro en Expo Go. Usar build de desarrollo / EAS.

## Metro / cache rara

```bash
pnpm --filter=@helu/mobile start -- --clear
```

## Duplicados `* 2.*` en el tree

Copias basura (Finder/iCloud). Ignorarlas; no importarlas. Limpieza pendiente a nivel repo.

## Skill contradice el código

Seguir el código; reportar drift (`packages/features`, Expo Router, MMKV). Ver `AGENTS.md`.

## Lectura siguiente

- [setup.md](./setup.md)
- [state.md](../architecture/state.md)
