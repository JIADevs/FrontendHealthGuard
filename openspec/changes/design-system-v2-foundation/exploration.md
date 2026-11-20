# Exploración: Design system v2 — base (tokens y fuentes)

**Change:** design-system-v2-foundation
**Issue:** JIADevs/FrontendHealthGuard#35 (Fase 0, primera parte)
**Fecha:** 2026-11-20
**Fuente de diseño:** `.docs/design/` (v2, vigente desde el 2026-11-20), sobre todo `system/MASTER.md` §4–§6 y `system/tokens.css`

## Estado actual del código

### Tokens (`packages/ui/src/tokens/tokens.ts`)

- `palette.brand = colors.primary` (escala blue). Los valores de la v2 ya existen en la escala: `brand[600]` = `#2563EB` (sólido), `brand[700]` = `#1D4ED8` (texto), `brand[800]` = `#1E40AF` (canto) y `brand[500]` = `#3B82F6` (foco).
- `palette.accent`:
  - `document` y `backpack` están en green y orange (en la v2: sky y teal);
  - `notification` está en emerald (en la v2: el color de marca);
  - no existen `wellbeing`, `mission`, `treatment` ni la paleta de motivación.
- Faltan escalas o tonos de la v2:
  - la escala `teal` completa;
  - `green[800]`, `orange[800]` y `error[700]`;
  - los tonos 300/400 que usa el modo oscuro en sky, teal, emerald, amber y violet.
- `radii` va de 4 a 20. La v2 suma input 14, tarjeta 18, modal 24 y hoja 28.
- `fontFamily` solo tiene Inter (`sans`) y mono. `nativeFontFamily.sans = 'Inter'`, pero la fuente **no se carga en ninguna app**: no hay `useFonts` en mobile ni `next/font` en web.

### Tema (`packages/ui/src/tokens/theme.ts`)

| Clave | Hoy (claro) | v2 (claro) | Problema |
|---|---|---|---|
| `brand.solid` | `brand[500]` `#3B82F6` | `#2563EB` | Texto blanco: 3,68:1, no pasa AA |
| `text.secondary` | `slate[500]` | `gray[500]` `#6B7280` | — |
| `text.muted` | `gray[400]` `#9CA3AF` | `slate[500]` `#64748B` | 2,54:1 sobre blanco |
| `border.default` | `gray[200]` | `slate[200]` `#E2E8F0` | — |
| `surface.bg` | `slate[50]` | `#F6F8FC` | — |
| `status.errorFg` / `successFg` / `warningFg` | tono 500 | tono 700 | Texto sobre tinte < 4,5:1 |
| `accent.*Fg` | tonos 500–600 | tono 700 | Ídem |
| `brand.solid` (oscuro) | `brand[800]` | `#3B82F6` | — |

`AppTheme` es un tipo explícito con claves fijas. Lo consumen pantallas y componentes, así que las claves actuales tienen que seguir existiendo.

### Variables CSS (`packages/ui/src/tokens/cssVariables.ts`)

- Emite nombres de la v1: `--brand-*`, `--gray-*`, `--text-*`, `--accent-*`, `--radius*`, `--font-sans`, con su bloque oscuro.
- El CSS de web usa esos nombres:
  - `background: var(--brand-500)` 9 veces y `color: var(--brand-500)` 5 veces, en botones y enlaces;
  - `var(--brand-600)` 21 veces como texto o relleno.
- No emite las variables `--color-*` de la v2.

### Usos directos de `palette.brand[500]` (29 archivos)

| Tipo | Dónde | Qué pide la v2 |
|---|---|---|
| Relleno con texto blanco | `Button` (web y native), `Chip` default, `Pagination.web` activo, `Checkbox`, `ExpandableFAB`, `DetailFooter`, `DependientesScreen`, `DependientesInviteScreen`, `DelegationRequestCard`, `AuthSubmitButton` (degradado 400→500) | `brand.solid` (600) |
| Texto o enlace | `authStyles` (2), «Confirmar» en `DatePicker`, `TimePicker` y `DateTimePicker`, íconos de `NotificationsScreen` | `brand.text` (700) o `brand.solid` |
| Ícono o spinner | `MoreScreen`, `DependientesScreen`, `App.tsx`, `Pagination.native`, `Spinner` | `brand.solid` |
| Borde de foco | `TextField.native`, `Select.native` | `brand.focus` (500): se mantiene |
| Fuera de alcance | `dependientes/colorTokens.ts` (paleta de colores de contexto), `pushTokenRegistration.ts` (LED de Android) | Sin cambio |

### Fuentes

- Solo `Typography.native` usa `nativeFontFamily`. El resto de las pantallas móviles usa la fuente del sistema con `fontWeight`.
- En React Native, cada peso de una fuente cargada es una familia distinta (`Inter_600SemiBold`). `fontWeight` no elige el archivo en Android, así que hay que mapear el peso a la familia.
- Expo SDK 57: `expo-font` ya está en el árbol de dependencias. Faltan `@expo-google-fonts/nunito` y `@expo-google-fonts/inter`.
- Next 16: `next/font/google` está disponible sin dependencias nuevas.

### Colores escritos a mano en mobile

| Archivo | Valor | Reemplazo |
|---|---|---|
| `AgendaTaskFormScreen.tsx:578`, `AppointmentFormScreen.tsx:802` | `#e53e3e` | `status.errorFg` |
| `MedicationDetailScreen.tsx:411,415` | `#FFF3CD`, `#856404` | `status.warningBg` / `warningFg` |
| `CycleDetailScreen.tsx:352,371` | `#4ade80` | `motivation.progress` |

### Otros

- Hay 26 archivos que usan `accent.document`, `accent.backpack`, `accent.notification` o sus claves del tema. Cambian solos al reasignar la paleta: es el efecto buscado.
- Quedan 2 «tenés» de voseo en el copy.
- No hay test runner. Se verifica con `pnpm exec tsc --noEmit -p apps/mobile` y `pnpm --filter @helu/web build` (`openspec/config.yaml`).

## Conclusión

Si solo se cambian los valores de `theme.ts`, los botones principales siguen en `brand[500]`, porque los 29 archivos lo usan directo. Hay que cambiar las tres cosas juntas: tokens, tema y los usos directos. Si no, la app queda con dos azules. Las fuentes son independientes, pero entran en el mismo PR porque ningún componente las usa hasta que existan.
