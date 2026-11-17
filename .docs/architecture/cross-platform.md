# Multiplataforma

Qué se comparte entre web y mobile, y cómo se bifurca lo demás.

## Capas compartidas

| Capa | Compartido |
|------|------------|
| Contratos API | `@helu/api` (endpoints, schemas, hooks, cores) |
| Estado de sesión/UI | `@helu/stores` |
| Design system | `@helu/ui` tokens + componentes con split nativo/web |
| Config URL | `@helu/config` |

## Split de plataforma

### Package exports (`@helu/ui`)

```json
".": {
  "react-native": "./src/index.ts",
  "default": "./src/web.ts"
}
```

- Mobile: `index.ts` → implementaciones `*.native.tsx` + `ThemeProvider` + `HeluAgendaCalendar`.
- Web: `web.ts` → `*.web.tsx`; **sin** ThemeProvider ni calendario en el export web.

### Archivos `.native.ts`

Ejemplo: `packages/config/src/readExpoExtraApiUrl.native.ts` lee `expo-constants`; el stub web devuelve `undefined`.

### Componentes platform

Patrón: `Component.types.ts` + `Component.native.tsx` + `Component.web.tsx`. Las apps importan `@helu/ui` y el bundler elige la variante.

## Bootstrap mobile vs web

| Concern | Mobile | Web |
|---------|--------|-----|
| Entry | `index.ts` → storage → env → `App` | Next `app/layout.tsx` |
| Auth providers | `setApiAuthProviders` en `App.tsx` | Fallback localStorage en `client.ts` |
| Theme | `ThemeProvider` RN | CSS variables `generateCssVariables()` |
| API host en emulador | `bootstrapEnv.ts` remapea a `10.0.2.2` / `127.0.0.1` en `__DEV__` | `NEXT_PUBLIC_API_URL` |

## Qué no compartir

- Navegación (React Navigation ≠ App Router).
- Push / EAS / deep links (solo mobile).
- Screens: viven en cada app; reutilizar cores y UI, no copiar pantallas enteras.

## Lectura siguiente

- [design-system.md](./design-system.md)
- [packages/ui.md](./packages/ui.md)
- Skill: `platform-component`
