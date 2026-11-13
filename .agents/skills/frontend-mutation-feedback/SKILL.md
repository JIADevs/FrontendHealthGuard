---
name: frontend-mutation-feedback
description: >
  Define feedback de UI obligatorio para llamadas al backend que mutan datos: indicador de carga
  (spinner o equivalente) durante la petición y notificación al terminar (éxito o error).
  Las notificaciones de éxito no aplican al refresco puro de registros (queries de lectura, refetch,
  invalidaciones silenciosas). Usar al implementar formularios, botones de guardar/eliminar,
  adjuntos, useMutation, o al revisar UX de endpoints que no sean solo lectura.
---

# Feedback en mutaciones al API (frontend)

## Regla

Toda acción que **persiste o altera datos en el backend** mediante un endpoint (crear, editar, borrar, acciones que cambian estado, subida de archivos, etc.) debe ofrecer:

1. **Indicador de carga** — visible mientras la petición está en curso (spinner en botón, overlay, estado deshabilitado con feedback claro, lineal en pantalla, etc.).
2. **Notificación al completar** — mensaje de éxito o de error según el resultado (toast, banner, inline según patrones del proyecto).

Esto aplica a `useMutation`, llamadas imperativas que escriben, y flujos equivalentes en web o mobile.

## Excepción: refresco de registros

**No** se exige notificación de éxito cuando la operación es **solo lectura** o un **refresco/revalidación** de datos ya mostrados, por ejemplo:

- `refetch`, `invalidateQueries` pensado como actualización de lista/detalle sin acción explícita del usuario “guardar”.
- Cargas iniciales y paginación de solo lectura.
- Polling o revalidación en segundo plano.

Siguen siendo aceptables spinners/skeletons de carga para UX, pero **no** hace falta toast de “éxito” por haber actualizado datos en pantalla.

Si el usuario dispara explícitamente un “Actualizar” o “Sincronizar” que solo llama al API de lectura, puede optarse por feedback breve (opcional según producto); la regla estricta de **no notificación de éxito** aplica sobre todo al refresco **automático o rutinario** tras mutaciones ya confirmadas.

## Errores

Las mutaciones que fallen deben mostrar **siempre** un mensaje de error comprensible (notificación o estado inline), además de quitar o mantener el spinner según corresponda.

## Checklist rápida

- [ ] ¿Es POST/PUT/PATCH/DELETE o equivalente que cambia datos? → Spinner + notificación éxito/error.
- [ ] ¿Es solo GET / lectura / refetch silencioso? → Sin toast de éxito obligatorio; manejo de error según el caso.
