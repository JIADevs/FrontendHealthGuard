# App `@helu/mobile`

Expo / React Native. Experiencia principal de Helu.

## Bootstrap

```text
index.ts → bootstrapStorage → bootstrapEnv → App.tsx
```

`App.tsx` cablea: auth providers, QueryClient, cleaner de cache por paciente, ThemeProvider, NavigationContainer, sync de unread + push.

## Navegación

Tabs: Documents · Agenda · Home · Backpacks · More. Stack root para auth y pantallas modales. Detalle: [navigation.md](../navigation.md).

## Carpetas locales

| Path | Rol |
|------|-----|
| `src/screens/` | Pantallas por dominio |
| `src/components/` | UI específica de la app (agenda, auth, backpacks, …) |
| `src/hooks/` | Wrappers de cores + `usePushNotifications` |
| `src/navigation/` | Navigators + routing de notificaciones |
| `src/services/` | Registro de push token |

## Notificaciones

- `expo-notifications` (omitido en Expo Go)
- `pushTokenRegistration.ts` → `registerDeviceToken` / `unregisterDeviceToken` (`skipPatientContext`)
- Deep links vía `notificationRouting.ts`

## Build

EAS: `eas.json` (preview/production APK), scripts `build:apk` / `build:apk:local`. Ver [build-release.md](../../technical/build-release.md).

## Lectura siguiente

- Features en `BackendHealthGuard/.docs/features/`
- [cross-platform.md](../cross-platform.md)
