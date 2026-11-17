---
name: code-conventions
description: >
  Convenciones de código, estructura de archivos y reglas de escalabilidad para la app Helu.
  Usar siempre como referencia al escribir cualquier código nuevo, hacer code review, nombrar archivos,
  definir exports, estructurar imports, manejar errores, escribir TypeScript o decidir dónde va
  cada pieza de lógica. Es la guía de estilo del proyecto — consultar ante cualquier duda sobre
  "cómo se hace esto en Helu".
---

# Code Conventions — Helu

## Reglas absolutas

1. **Componentizar cuando sea necesario** — si un archivo tiene múltiples responsabilidades, dividirlo de forma limpia y ordenada
2. **TypeScript estricto** — nunca `any`, nunca `as Type` sin justificación
3. **Zod primero** — definir schema antes de escribir tipos o lógica
4. **Exports nombrados** — nunca `export default` en packages compartidos
5. **Imports absolutos** — nunca rutas relativas entre packages (`../../`)
6. **Colores de tokens** — nunca hex literales (ver skill `design-system`)

---

## Estructura del monorepo

```
frontend/
├── apps/
│   ├── mobile/         ← Expo + React Navigation (thin wrappers)
│   │   └── src/
│   │       ├── screens/
│   │       ├── hooks/          ← Adapters: conectan core hooks con UI local
│   │       ├── components/     ← Componentes mobile-only
│   │       └── navigation/
│   └── web/            ← Next.js App Router (thin wrappers)
│       └── src/
│           ├── app/            ← Rutas (pages + layouts)
│           ├── hooks/          ← Adapters: conectan core hooks con UI local
│           └── components/     ← Componentes web-only
├── packages/
│   ├── ui/             ← Componentes compartidos (Shared Types Pattern)
│   │   └── src/
│   │       ├── tokens/          ← Design system (tokens, theme, ThemeProvider)
│   │       ├── primitives/      ← Base: Button, Typography, Spinner, Chip, EmptyState...
│   │       ├── forms/           ← Inputs: TextField, Select, DatePicker...
│   │       ├── containers/      ← Layout: Card, Modal
│   │       ├── composed/        ← Compuestos: ConfirmModal
│   │       ├── utils/           ← Helpers (formatters, constants, documentTypes)
│   │       ├── index.ts         ← Entry point mobile (.native.tsx)
│   │       └── web.ts           ← Entry point web (.web.tsx)
│   ├── api/            ← Cliente HTTP + hooks core + schemas Zod
│   │   └── src/
│   │       ├── client.ts        ← Axios con auto-refresh
│   │       ├── endpoints.ts     ← Funciones de API
│   │       ├── hooks.ts         ← Re-exports de hooks
│   │       ├── use*Core.ts      ← Core hooks (lógica agnóstica)
│   │       └── schemas/         ← Schemas Zod
│   ├── config/         ← Variables de entorno tipadas
│   └── stores/         ← Zustand stores (auth, notificaciones)
```

### Regla de capas

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| `packages/ui` | Componentes visuales multiplataforma | `Button`, `Card`, `Modal` |
| `packages/api` | Lógica de negocio agnóstica + schemas | `useAppointmentsCore`, `endpoints.ts` |
| `packages/stores` | Estado global persistido | `authStore`, `notifStore` |
| `packages/config` | Configuración de entorno | `env.API_URL` |
| `apps/*/hooks` | Adapters que conectan core hooks con UI | `useAppointmentForm.ts` |
| `apps/*/screens` o `apps/*/app` | Thin wrappers (solo composición) | `AgendaScreen.tsx` |

**Nunca** poner lógica de negocio en pantallas — solo composición de UI + hooks.
**Nunca** poner queries directas en pantallas — usar hooks de `@helu/api`.

---

## Nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes UI compartidos | PascalCase + plataforma | `Button.types.ts`, `Button.native.tsx` |
| Componentes de app | PascalCase | `ConfirmModal.tsx` |
| Hooks core | camelCase con `use*Core` | `useAppointmentsCore.ts` |
| Hooks adapter | camelCase con `use` | `useAppointmentForm.ts` |
| Schemas | camelCase con `.schema` | `appointment.schema.ts` |
| Stores | camelCase con `Store` | `authStore.ts` |
| Constantes | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Pantallas mobile | PascalCase + `Screen` | `AgendaScreen.tsx` |
| Páginas web | `page.tsx` (Next.js convention) | `agenda/page.tsx` |

---

## Estructura de imports (orden estricto)

```ts
// 1. React y React Native
import { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";

// 2. Librerías externas
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// 3. Packages internos (@helu/*)
import { Button, Card } from "@helu/ui";
import { useAppointmentsCore } from "@helu/api/hooks";
import { useAuthStore } from "@helu/stores";

// 4. Imports locales (mismo package o carpeta)
import { ConfirmModal } from "../components/ConfirmModal";
import type { Appointment } from "@helu/api";
```

---

## TypeScript — reglas clave

```ts
// ✅ Inferir tipos desde Zod
export type Appointment = z.infer<typeof AppointmentSchema>;

// ✅ Tipos de props en archivo .types.ts separado
export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  onPress?: () => void;
}

// ❌ Nunca
const data: any = response.data;
const user = response as User;
function process(items: any[]) {}

// ✅ Narrowing seguro
if (isApiError(error)) {
  // error es ApiError aquí
}
```

---

## Patrón Core Hook + Adapter

**Core hook** (`packages/api/src/use*Core.ts`): Lógica de negocio pura, agnóstica de UI.

```ts
// packages/api/src/useAppointmentsCore.ts
export function useAppointmentsCore(page: number, filters?: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', page, filters],
    queryFn: () => fetchAppointments(page, filters),
  });
}
```

**Adapter hook** (`apps/*/hooks/`): Conecta el core hook con la UI y navegación local.

```ts
// apps/mobile/src/hooks/useAppointmentForm.ts
import { useAppointmentsCore, useCreateAppointment } from '@helu/api/hooks';

export function useAppointmentForm(navigation: any) {
  const create = useCreateAppointment();
  // Adapter: conecta la mutación con la navegación local
  const handleSubmit = (data: CreateAppointment) => {
    create.mutate(data, { onSuccess: () => navigation.goBack() });
  };
  return { handleSubmit, isLoading: create.isPending };
}
```

---

## Estructura de una pantalla (thin wrapper)

Las pantallas en `apps/` deben ser lo más simples posible.

### Mobile

```tsx
// apps/mobile/src/screens/AgendaScreen.tsx
import { View, FlatList } from "react-native";
import { Typography, Card, Spinner } from "@helu/ui";
import { useAppointmentsCore } from "@helu/api/hooks";

export function AgendaScreen() {
  const { data, isLoading } = useAppointmentsCore(1);

  if (isLoading) return <Spinner />;

  return (
    <FlatList
      data={data?.items}
      renderItem={({ item }) => (
        <Card>
          <Typography variant="h3">{item.doctor}</Typography>
        </Card>
      )}
    />
  );
}
```

### Web

```tsx
// apps/web/src/app/(app)/agenda/page.tsx
"use client";
import { Typography, Card, Spinner } from "@helu/ui";
import { useAppointmentsCore } from "@helu/api/hooks";

export default function AgendaPage() {
  const { data, isLoading } = useAppointmentsCore(1);

  if (isLoading) return <Spinner />;

  return (
    <div>
      {data?.items.map((item) => (
        <Card key={item.id}>
          <Typography variant="h3">{item.doctor}</Typography>
        </Card>
      ))}
    </div>
  );
}
```

---

## Manejo de errores en componentes

```tsx
function AppointmentsScreen() {
  const { data, isLoading, error, refetch } = useAppointmentsCore(1);

  if (isLoading) return <Spinner />;

  if (error) {
    return (
      <ErrorState
        message={isApiError(error) ? error.message : "Error inesperado"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data?.items.length) return <EmptyState message="No tenés citas agendadas" />;

  return <AppointmentList appointments={data.items} />;
}
```

---

## Helpers compartidos

Formatters y utilidades viven en `packages/ui/src/formatters.ts`:

```ts
import { formatDate, formatTime, formatRelative } from '@helu/ui';
```

---

## Checklist de PR

**Estructura**
- [ ] Archivos con responsabilidades claras y bien separadas
- [ ] Imports en el orden correcto (`react` → `externas` → `@helu/*` → `locales`)
- [ ] Exports nombrados (no default en packages/)
- [ ] Tipos inferidos desde Zod donde corresponde

**Lógica**
- [ ] Datos del servidor en TanStack Query (no en Zustand)
- [ ] Estado UI en Zustand o useState local
- [ ] Errores manejados con `isApiError()`
- [ ] No hay `console.log` en producción

**UI**
- [ ] Componentes con accesibilidad (`accessibilityLabel`, `accessibilityRole`)
- [ ] Estados de loading, error y vacío implementados
- [ ] Colores de `tokens.ts` — nunca hex literales (ver skill `design-system`)
- [ ] Componentes compartidos usan Shared Types Pattern (ver skill `component-creation`)

**Seguridad**
- [ ] Tokens nunca en MMKV — usar `expo-secure-store`
- [ ] Datos del paciente nunca en logs
- [ ] Variables de entorno solo a través de `@helu/config`

**Escalabilidad**
- [ ] Lógica de negocio en `packages/api/use*Core.ts`, no en pantallas
- [ ] Componente nuevo exportado desde `index.ts` y `web.ts`
- [ ] Sin imports relativos entre packages
