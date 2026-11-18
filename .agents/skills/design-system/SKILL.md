---
name: design-system
description: >
  Define el sistema de diseño centralizado de Helu: paleta semántica de 3 niveles,
  tipografía, espaciado, radios, sombras y tokens semánticos.
  Usar siempre al crear un componente, elegir un color, definir un estilo o cuando
  haya dudas sobre "qué color uso aquí". Es la fuente de verdad visual.
  Se consume tanto en apps/mobile (StyleSheet) como en apps/web (CSSProperties + CSS vars).
---

# Design System — Helu

> **Sistema objetivo (rediseño B):** las reglas vigentes de diseño están en [`.docs/design/system/MASTER.md`](../../../.docs/design/system/MASTER.md) (tokens en `tokens.json`/`tokens.css`, componentes en `componentes.md`, formularios y movimiento en `pages/`). Esta skill describe los tokens **tal como están hoy en el código**; las diferencias con el objetivo (por ejemplo `brand[500]` → `brand[600]`, documentos green → sky, mochilas orange → teal, Nunito para títulos) están en el ADR 0002 (`.docs/architecture/adr/0002-adopt-design-system-b.md`). Al crear UI nueva, seguir el sistema objetivo.

## Fuente de verdad: `packages/ui/src/tokens/tokens.ts`

Todos los valores de diseño viven en un solo archivo TypeScript.
**Nunca escribir un hex literal en un componente** — siempre importar de tokens.

```ts
import { palette, colors, spacing, fontSize, fontWeight, radii } from '@helu/ui';
```

---

## Paleta Semántica — 3 Niveles

> **IMPORTANTE**: Los componentes usan `palette.*`, NO `colors.*` directamente.
> Cambiar el color de marca = cambiar 1 línea en `tokens.ts` (`brand: colors.sky` → `brand: colors.violet`).

### Nivel 1 — Brand (Principal)

```ts
palette.brand[500]  // #0ea5e9 — Botones primarios, tab activo, FAB
palette.brand[600]  // #0284c7 — Hover de botones primarios
palette.brand[50]   // #f0f9ff — Fondo de badge activo, tint suave
```

| Uso | Token |
|-----|-------|
| Botón primario | `palette.brand[500]` |
| Hover / pressed | `palette.brand[600]` / `palette.brand[700]` |
| Fondo suave | `palette.brand[50]` |
| Sidebar activo | `palette.brand[500]` |
| Focus ring | `palette.brand[400]` |

### Nivel 2 — Status (Semánticos)

Colores con significado funcional fijo. No cambian con la marca.

```ts
palette.status.success  // → colors.success (verde)
palette.status.warning  // → colors.warning (ámbar)
palette.status.error    // → colors.error (rojo)
palette.status.info     // → colors.sky (azul)
```

| Estado | Token fondo | Token texto/icono |
|--------|-------------|-------------------|
| Éxito | `palette.status.success[50]` | `palette.status.success[500]` |
| Advertencia | `palette.status.warning[50]` | `palette.status.warning[500]` |
| Error | `palette.status.error[50]` | `palette.status.error[500]` |

### Nivel 3 — Accent (Features)

Colores para diferenciar secciones/features de la app.

```ts
palette.accent.ai           // colors.violet — IA / clasificación
palette.accent.medication   // colors.amber — Medicamentos
palette.accent.notification // colors.emerald — Check-ins
palette.accent.document     // colors.green — Documentos
palette.accent.calendar     // colors.pink — Calendario
palette.accent.backpack     // colors.orange — Mochilas
```

### Neutros

```ts
palette.neutral  // colors.gray — texto, bordes generales
palette.surface  // colors.slate — superficies, fondos
```

---

## Superficies, Texto y Bordes

Tokens semánticos que definen la estructura visual base:

```ts
// tokens.ts — ya exportados
export const surface = {
  bg:             colors.slate[50],   // Fondo de pantalla
  bgCard:         colors.white,       // Fondo de tarjeta
  bgSidebar:      colors.slate[900],  // Sidebar web (dark)
  bgSidebarHover: colors.slate[800],
};

export const text = {
  primary:   colors.gray[900],   // Texto principal
  secondary: colors.slate[500],  // Texto secundario
  sidebar:   colors.slate[200],  // Texto sidebar (sobre fondo oscuro)
  muted:     colors.gray[400],   // Texto deshabilitado / placeholder
};

export const border = {
  default: colors.gray[200],     // Bordes estándar
  light:   colors.slate[100],    // Bordes sutiles
  medium:  colors.slate[200],    // Bordes medios
};
```

---

## Tipografía

| Token | Valor | Uso |
|-------|-------|-----|
| `fontSize.xs` | 11 | Captions, labels pequeños |
| `fontSize.sm` | 13 | Texto secundario, botones small |
| `fontSize.base` | 15 | Cuerpo de texto |
| `fontSize.md` | 16 | Botones medianos |
| `fontSize.lg` | 18 | Subtítulos |
| `fontSize.xl` | 20 | Títulos de sección |
| `fontSize['2xl']` | 22 | Títulos de tarjeta |
| `fontSize['3xl']` | 24 | Títulos de pantalla |
| `fontSize['4xl']` | 28 | Headers principales |

### Font families

```ts
// Web — soporta fallbacks CSS
fontFamily.sans  // 'Inter, system-ui, sans-serif'
fontFamily.mono  // 'JetBrains Mono, Menlo, monospace'

// React Native — solo nombre exacto
nativeFontFamily.sans  // 'Inter'
nativeFontFamily.mono  // 'JetBrainsMono'
```

### Font weights

```ts
fontWeight.normal    // '400'
fontWeight.medium    // '500'
fontWeight.semibold  // '600'
fontWeight.bold      // '700'
fontWeight.extrabold // '800'
```

---

## Espaciado y Radios

```ts
// Espaciado (múltiplos de 4)
spacing[1]  // 4     spacing[6]  // 24
spacing[2]  // 8     spacing[8]  // 32
spacing[3]  // 12    spacing[10] // 40
spacing[4]  // 16    spacing[12] // 48
spacing[5]  // 20

// Radios de borde
radii.xs    // 4     radii.xl   // 20
radii.sm    // 8     radii.full // 9999
radii.md    // 12
radii.lg    // 16
```

---

## Estructura de `packages/ui/src/` (Flat Groups)

```
tokens/        ← Design system foundation
primitives/    ← Componentes base (Button, Typography, Spinner, Chip, etc.)
forms/         ← Inputs (TextField, Select, DatePicker, etc.)
containers/    ← Layout (Card, Modal)
composed/      ← Compuestos que usan otros componentes (ConfirmModal)
utils/         ← Helpers (formatters, constants, documentTypes)
index.ts       ← Entry point mobile
web.ts         ← Entry point web
```

Regla de dependencias: `tokens → primitives → forms/containers → composed`

---

## Consumo por plataforma

### Mobile (React Native)

```tsx
import { palette, spacing, fontSize, fontWeight, radii } from '@helu/ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: palette.surface[200],
  },
  activeTab: {
    borderBottomColor: palette.brand[500],
  },
});
```

### Web (CSSProperties + CSS Variables)

```tsx
"use client";
import { palette, spacing, radii } from '@helu/ui';

const style: React.CSSProperties = {
  backgroundColor: colors.white,
  borderRadius: radii.md,
  padding: spacing[4],
};
```

`cssVariables.ts` genera variables CSS para `globals.css`:

```css
.card {
  background: var(--surface-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
```

---

## Prohibiciones

- ❌ `backgroundColor: '#3b82f6'` — usar `palette.brand[500]`
- ❌ `colors.sky[500]` — usar `palette.brand[500]`
- ❌ `color: 'red'` — usar `palette.status.error[500]`
- ❌ `rgba(0, 0, 0, 0.3)` inline — usar `overlay.dark`
- ❌ `fontSize: 16` literal — usar `fontSize.md`
- ❌ `borderRadius: 8` literal — usar `radii.sm`
- ❌ `padding: 16` literal — usar `spacing[4]`

---

## Checklist de PR — Design System

- [ ] ¿Colores usan `palette.*` (no `colors.sky` directo)?
- [ ] ¿Texto usa `fontSize.*` y `fontWeight.*`?
- [ ] ¿Espaciado usa `spacing[N]`?
- [ ] ¿Radios usan `radii.*`?
- [ ] ¿No hay hex literales hardcodeados?
- [ ] ¿Web usa `"use client"` si el componente tiene estado?
- [ ] ¿Mobile usa `StyleSheet.create()` como estilo base?
