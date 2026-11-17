---
name: component-creation
description: >
  Crea componentes UI compartidos en packages/ui de Helu usando el Shared Types Pattern.
  Usar cuando se cree un nuevo componente reutilizable (Button, Card, Modal, etc.),
  se necesite que funcione en Web y Mobile desde el mismo contrato de props,
  o cuando haya dudas sobre la estructura de archivos de un componente multiplataforma.
  Referencia obligatoria: skill design-system para colores y tokens.
---

# Component Creation — Helu UI

## Principio: Shared Types Pattern

Cada componente se divide en **3 archivos** dentro de su carpeta en `packages/ui/src/`:

```
packages/ui/src/
├── tokens/              ← Design system foundation
├── primitives/          ← Componentes base (sin deps internas)
│   └── StatusBadge/
│       ├── StatusBadge.types.ts      ← Contrato de props (compartido)
│       ├── StatusBadge.native.tsx    ← Implementación React Native
│       └── StatusBadge.web.tsx       ← Implementación Web (React DOM)
├── forms/               ← Inputs y campos
├── containers/          ← Layout (Card, Modal)
├── composed/            ← Compuestos que usan otros componentes
└── utils/               ← Helpers compartidos
```

**¿En qué carpeta va mi componente?**
- `primitives/` — si solo depende de tokens (Button, Chip, EmptyState)
- `forms/` — si es un input (TextField, Select, DatePicker)
- `containers/` — si es estructura de layout (Card, Modal)
- `composed/` — si usa otros componentes del paquete (ConfirmModal)

- `.types.ts` — Fuente de verdad de la API del componente. Sin imports de plataforma.
- `.native.tsx` — Usa `StyleSheet.create()`, primitivas RN (`View`, `Text`, `Pressable`).
- `.web.tsx` — Usa `"use client"`, inline CSSProperties, elementos HTML (`<button>`, `<div>`).

---

## Paso 1 — Definir el contrato (`.types.ts`)

```ts
// packages/ui/src/StatusBadge.types.ts
import type { ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  /** Web only — soporta className adicional */
  className?: string;
}
```

### Reglas del contrato
- Solo tipos — **cero** imports de `react-native` ni de `react-dom`
- Documentar props web-only / mobile-only con JSDoc
- Exportar todos los types usados por ambas implementaciones
- Usar `type` en lugar de `interface` para unions y `interface` para objetos

---

## Paso 2 — Implementación Mobile (`.native.tsx`)

```tsx
// packages/ui/src/primitives/StatusBadge/StatusBadge.native.tsx
import { View, Text, StyleSheet } from 'react-native';
import { palette, radii, spacing, fontSize, fontWeight } from '../../tokens/tokens';
import type { StatusBadgeProps, BadgeVariant } from './StatusBadge.types';

const bgByVariant: Record<BadgeVariant, string> = {
  success: palette.status.success[50],
  warning: palette.status.warning[50],
  error:   palette.status.error[50],
  info:    palette.brand[50],
};

const colorByVariant: Record<BadgeVariant, string> = {
  success: palette.status.success[600],
  warning: palette.status.warning[600],
  error:   palette.status.error[600],
  info:    palette.brand[600],
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bgByVariant[variant] }]}>
      <Text style={[styles.text, { color: colorByVariant[variant] }]}>
        {typeof children === 'string' ? children : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
```

### Reglas mobile
- **Siempre** importar colores de `../../tokens/tokens` — nunca hex literales
- Usar `palette.*` para colores de marca y estados, no `colors.sky` directo
- Usar `StyleSheet.create()` para estilos base estáticos
- Variantes dinámicas via `Record<Variant, string>` + style arrays
- Iconos: usar `lucide-react-native`

---

## Paso 3 — Implementación Web (`.web.tsx`)

```tsx
// packages/ui/src/StatusBadge.web.tsx
"use client";
import { colors, radii, spacing, fontSize, fontWeight } from './tokens';
import type { StatusBadgeProps, BadgeVariant } from './StatusBadge.types';

const bgByVariant: Record<BadgeVariant, string> = {
  success: colors.success[50],
  warning: colors.warning[50],
  error:   colors.error[50],
  info:    colors.sky[50],
};

const colorByVariant: Record<BadgeVariant, string> = {
  success: colors.success[600],
  warning: colors.warning[600],
  error:   colors.error[600],
  info:    colors.sky[600],
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${spacing[1]}px ${spacing[3]}px`,
        borderRadius: radii.full,
        backgroundColor: bgByVariant[variant],
        color: colorByVariant[variant],
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
      }}
    >
      {children}
    </span>
  );
}
```

### Reglas web
- **Siempre** `"use client"` al inicio si el componente usa hooks o eventos
- Inline `CSSProperties` con tokens — no clases CSS dinámicas
- Hover states via `useState` + `onMouseEnter`/`onMouseLeave`
- Iconos: usar `lucide-react`
- Transiciones: `transition: 'background 0.15s, opacity 0.15s'`

---

## Paso 4 — Registrar exports

### Mobile — `packages/ui/src/index.ts`

```ts
export * from './primitives/StatusBadge/StatusBadge.types';
export * from './primitives/StatusBadge/StatusBadge.native';
```

### Web — `packages/ui/src/web.ts`

```ts
export * from './primitives/StatusBadge/StatusBadge.types';
export * from './primitives/StatusBadge/StatusBadge.web';
```

### ¿Cómo resuelve la plataforma correcta?

El `package.json` de `@helu/ui` usa conditional exports:

```json
{
  "exports": {
    ".": {
      "react-native": "./src/index.ts",
      "default": "./src/web.ts"
    }
  }
}
```

Metro (mobile) resuelve `.native.tsx` vía `react-native` condition.
Next.js (web) resuelve `.web.tsx` vía `default`.

---

## Composición y Layout

Para componentes compuestos, usar composición de primitivas UI:

```tsx
// En una pantalla (thin wrapper)
import { Button, Card, Typography, StatusBadge } from '@helu/ui';

function AppointmentCard({ appointment }) {
  return (
    <Card>
      <Typography variant="h3">{appointment.doctor}</Typography>
      <Typography variant="body" color="secondary">{appointment.specialty}</Typography>
      <StatusBadge variant={statusToVariant(appointment.status)}>
        {appointment.status}
      </StatusBadge>
      <Button onPress={() => handleAction(appointment.id)}>Ver detalle</Button>
    </Card>
  );
}
```

---

## Anti-patrones

```tsx
// ❌ NativeWind / className en componentes de @helu/ui
<View className="bg-blue-500 p-4 rounded-lg">

// ✅ Tokens directos
<View style={{ backgroundColor: colors.sky[500], padding: spacing[4], borderRadius: radii.lg }}>

// ❌ CVA / class-variance-authority
const buttonVariants = cva("base-class", { variants: {...} });

// ✅ Record maps
const bgByVariant: Record<ButtonVariant, string> = { primary: colors.sky[500] };

// ❌ Hex literal en componente
backgroundColor: '#0ea5e9'

// ✅ Token
backgroundColor: colors.sky[500]
```

---

## Componentes existentes

| Componente | Archivos | Descripción |
|------------|----------|-------------|
| `Button` | `.types` `.native` `.web` | CTA con variantes primary/secondary/danger/ghost |
| `Card` | `.types` `.native` `.web` | Contenedor con borde y sombra |
| `Modal` | `.types` `.native` `.web` | Overlay con backdrop |
| `TextField` | `.types` `.native` `.web` | Input de texto con label |
| `Select` | `.types` `.native` `.web` | Dropdown/picker |
| `Checkbox` | `.types` `.native` `.web` | Toggle con label |
| `SearchField` | `.types` `.native` `.web` | Input de búsqueda con debounce |
| `Typography` | `.types` `.native` `.web` | Texto con variantes h1-h4, body, caption |
| `Chip` | `.types` `.native` `.web` | Tag/pill seleccionable |
| `Spinner` | `.types` `.native` `.web` | Indicador de carga |
| `ActionButton` | `.types` `.native` `.web` | Botón de acción (icono + texto) |
| `Pagination` | `.types` `.native` `.web` | Paginación de listas |
| `CardGrid` | `.types` `.native` `.web` | Grid responsive de cards |
| `DatePicker` | `.types` `.native` `.web` | Selector de fecha |
| `TimePicker` | `.types` `.native` `.web` | Selector de hora |
| `DateTimePicker` | `.types` `.native` `.web` | Selector combinado fecha+hora |

---

## Checklist de PR — Componente nuevo

- [ ] `.types.ts` — Contrato sin imports de plataforma
- [ ] `.native.tsx` — Usa `StyleSheet.create()` + tokens de `./tokens`
- [ ] `.web.tsx` — Usa `"use client"` + `CSSProperties` + tokens
- [ ] Registrado en `index.ts` (types + native)
- [ ] Registrado en `web.ts` (types + web)
- [ ] Colores vienen de `colors.*` — nunca hex literales (ver skill `design-system`)
- [ ] Variantes implementadas con `Record<Variant, string>` maps
- [ ] Props web-only documentadas con JSDoc
- [ ] Ambas implementaciones aceptan las mismas props del contrato
