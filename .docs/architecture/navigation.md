# Navegación

## Mobile — React Navigation

No se usa Expo Router. Árbol en `apps/mobile/src/navigation/`.

| Navigator | Archivo | Contenido |
|-----------|---------|-----------|
| Root stack | `RootNavigator.tsx` | Auth (Login/Signup) vs app autenticada |
| Tabs | `TabNavigator.tsx` | Documents · Agenda · Home · Backpacks · More |
| Modales / stacks | registrados en root | Documentos, share, profile, settings, treatments, meds, appointments, agenda tasks, dependientes, etc. |

Helpers: `navigationRef.ts`, `notificationRouting.ts` (deep link desde push → Agenda / pantallas).

Screens: `apps/mobile/src/screens/**`.

## Web — Next.js App Router

Rutas bajo `apps/web/src/app/`.

| Ruta | Estado |
|------|--------|
| `/` | Redirect → `/login` |
| `/login`, `/signup` | Auth |
| `/(app)/dashboard` | Dashboard |
| `/(app)/documents` | Documentos + modales |
| `/(app)/agenda` | **Solo** tabs citas + medicamentos |
| `/(app)/treatments`, `/backpacks`, `/share`, `/profile` | Implementados |
| `/(app)/settings` | Parcial (theme; resto “próximamente”) |
| `/share/doc` | Consumo público por `token` |

Guard de sesión: `/(app)/layout.tsx` (sidebar, logout, campana).

Providers root: `QueryClientProvider` (`providers.tsx`). CSS vars del design system en `layout.tsx`.

## Paridad

| Capacidad | Mobile | Web |
|-----------|--------|-----|
| Calendario agenda + bienestar | Sí | No |
| Documentos / mochilas / tratamientos | Sí | Sí |
| Delegación / dependientes | Sí | Limitado / ausente según pantalla |
| Push + deep links | Sí | N/A |

## Lectura siguiente

- [apps/mobile.md](./apps/mobile.md)
- [apps/web.md](./apps/web.md)
- Skill: `navigation-setup` (ojo: ejemplos Expo Router desalineados)
