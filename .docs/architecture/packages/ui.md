# Package `@helu/ui`

Componentes compartidos y tokens. Entry distinto por plataforma (`index.ts` vs `web.ts`).

## Estructura

```text
src/
  tokens/
  primitives/
  forms/
  containers/
  composed/
  platform/HeluAgendaCalendar/
  utils/
```

Cada control tipado suele tener `*.types.ts` + `*.native.tsx` / `*.web.tsx`.

## Export web vs native

| | Native (`index.ts`) | Web (`web.ts`) |
|--|---------------------|----------------|
| Primitives/forms/containers | Sí (`.native`) | Sí (`.web`) |
| ThemeProvider | Sí | No (CSS vars en app) |
| HeluAgendaCalendar | Sí | No exportado |

También: `@helu/ui/hooks` → `useDebounceSearch`.

## Dependencias

Peers: `react`, `react-native`, `@tanstack/react-query`, `@helu/api` (calendario / datos).

## Reglas

1. Shared Types Pattern: props en `*.types.ts`, implementaciones por plataforma.
2. Preferir tokens semánticos (`palette`) sobre colores crudos.
3. Si el componente solo tiene sentido en una app, no subirlo a `ui`.

## Lectura siguiente

- [design-system.md](../design-system.md)
- [cross-platform.md](../cross-platform.md)
- Skills: `component-creation`, `design-system`, `platform-component`
