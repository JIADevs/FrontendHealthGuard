# Proposal: Design system v2 — Agenda e Inicio (Fase 1)

## Intent

Lleva la v2 a Agenda e Inicio en mobile y en web. La Fase 0 ya dejó tokens, fuentes y los componentes base. Esta ola los usa en las acciones de todos los días: tomar una dosis, el check-in, el calendario, las citas, los medicamentos, el bienestar, las tareas y el inicio.

El diseño que manda en mobile es `.docs/design/system/pages/inicio-agenda.md`, con `formularios.md` y `movimiento-interacciones.md`. En web manda `web.md` para el marco (columnas, modales, URLs) y la misma página de Agenda para el contenido. El grupo C no tiene mockup web auditado: se construye con esas dos fuentes.

**Plataformas:** `packages/api`, `packages/ui`, `apps/mobile` y `apps/web` (`/dashboard` y `/agenda`). **Backend: sin cambios.**

## Hoy

| Pieza | Estado en `dev` |
|---|---|
| Registrar una toma | `useConfirmIntakeMutation` y `useRecordIntakeMutation` invalidan al terminar. No hay `onMutate` |
| «No la tomé» | `MedicationIntakeCreate` ya tiene `status` (`TAKEN` / `NOT_TAKEN`) y `notTakenReason` (`FORGOT`, `NOT_PURCHASED`, `OTHER`). `recordIntake` hace `POST /medication-cycles/{id}/intakes` |
| «Tomar» al instante | `confirmIntake` hace el mismo POST con `taken_at` en la hora actual |
| Check-in | `useCreateDailyCheckInMutation` invalida al éxito. No es optimista |
| Revocar delegación | `useRevokeDelegationMutation` saca la fila de la cache antes de la respuesta |
| Racha | `UserProfile.currentStreak` y `longestStreak` ya vienen en `GET /users/me` |
| Ocultar una lista | `getPreference` / `setPreference` ya llaman a `/users/me/preferences/{key}` |
| Chip de opción | La variante `option` mide 44 px y muestra ✓ al estar seleccionada |
| Hoja, grupo de chips, descarte | No existen `BottomSheet`, `ChoiceChips` ni `DiscardChangesDialog` |
| Citas en mobile | Los estados `ASISTI` y `NO_ASISTI` ya existen en la app |
| Web Inicio | `/dashboard` abre con «Agendar cita», «Subir documento» y «Ver agenda». «Tomar» no es la acción primaria |
| Web Agenda | `/agenda` tiene pestañas Citas y Medicamentos (`?tab=`). No hay calendario, bienestar, detalle de ciclo ni alta de profesional. El alta y el detalle viven en estado local, sin URL propia |

## Decisiones

1. **Un change, un PR a `dev`.** Así lo pide el issue #35 para cada ola. La web de esta ola entra en el mismo PR porque comparte los hooks y los primitivos.
2. **La web cubre la misma Agenda que mobile.** Entran `/dashboard` y `/agenda`, con pestañas Calendario, Citas, Medicamentos y Bienestar. También entran el check-in, el detalle de ciclo y el profesional nuevo. El marco sigue `web.md`: modal de 560 px para formularios cortos, lista + detalle para el ciclo, y URL en cada uno.
3. **`BottomSheet` va a `@helu/ui`.** En mobile lo usan la hoja de toma, el check-in y las hojas de alta. En web, crear y editar siguen siendo modal (`web.md` §2), no una hoja.
4. **`ChoiceChips` es un grupo sobre `Chip` `option`.** No se dibuja otro chip. Vive en `@helu/ui` porque la frecuencia del medicamento y los motivos de no toma lo usan en mobile y en los modales web.
5. **`DiscardChangesDialog` va a `@helu/ui`.** En mobile lo usan los formularios de cita, profesional y medicamento. En web, cerrar un modal con cambios (×, Esc, clic afuera o Atrás) pasa por la misma pregunta.
6. **La toma y el check-in son optimistas, con rollback.** Revocar una delegación espera al servidor: se quita el `onMutate` de `useRevokeDelegationMutation`. Los colores de contexto siguen optimistas. El comportamiento es el mismo en las dos apps porque vive en `packages/api`.
7. **«Tomar» usa `confirmIntake`.** «No la tomé» y «Cambiar hora» usan `recordIntake`. No se agrega ningún endpoint.
8. **La UI mobile vive en `apps/mobile/src/components/{agenda,home}/`.** La UI web de estas pantallas vive junto a sus rutas. Las páginas solo conectan props y callbacks.
9. **Inicio no muestra misiones, nivel ni insignias.** Esos bloques están en el diseño, pero el issue los deja fuera porque el backend no los tiene. La meta semanal tampoco. En web se quita «Escanear».

## Scope

### In Scope

Orden de construcción: `packages/api`, después `packages/ui`, después los componentes de cada app, y al final las pantallas.

- **`packages/api`**
  - `useConfirmIntakeMutation` y `useRecordIntakeMutation`: `onMutate`, cache optimista y rollback si el servidor falla.
  - `useCreateDailyCheckInMutation`: igual, optimista con rollback.
  - `useRevokeDelegationMutation`: espera la respuesta. Si falla, la fila sigue en la lista.
- **`packages/ui`**
  - `BottomSheet` (mobile): asa, encabezado, contenido con scroll, evita el teclado y confirma al descartar si hay cambios.
  - `ChoiceChips`: `options`, `value`, `multiple`, `onChange`. Cada opción es un `Chip` `option`. Native y web.
  - `DiscardChangesDialog`: la opción segura va primero. Native y web.
- **Mobile · tomas**
  - «Tomar» en un toque, con la hora actual.
  - Hoja «No la tomé»: los motivos aparecen recién después de elegir no tomarla. Textos: «Se me olvidó», «No lo compré», «Otro».
  - «Cambiar hora» es opcional dentro de la hoja.
  - Estados de fila: pendiente («Tomar»), tomada, no tomada con el motivo, futura («Más tarde»).
- **Mobile · Agenda**
  - Leyenda del calendario siempre visible y el tipo de cada evento en texto.
  - En la lista del día, solo la acción urgente usa estilo primario o de éxito.
  - Citas en orden cronológico, separadas en «Próximas» y «Anteriores».
  - Detalle de cita: «¿Pudiste asistir?» (`ASISTI` / `NO_ASISTI`) desde la hora de la cita, «Cómo llegar» y «+ Agregar documento». «Cancelar cita» es un `DangerLink` al final y confirma con «Mantener cita».
  - Formularios de cita nueva y profesional nuevo.
  - Medicamentos en «Activos» y «Finalizados». Alta y detalle de ciclo, con «Tomar» si hay una dosis pendiente.
  - Bienestar: check-in de 5 caras, cada una con su etiqueta. Al guardar, toast con la racha.
  - Tareas: acento de marca, «Completar» y «Reprogramar».
- **Mobile · Inicio**
  - «Tomar» es la única acción primaria cuando hay una dosis pendiente.
  - Tarjeta de racha con `currentStreak` y `longestStreak`. El check-in de esa tarjeta es secundario.
  - Estado «Todo al día» cuando no queda nada pendiente.
  - Lista «Configura Helu», con «Ocultar esta lista». Ocultarla persiste con `setPreference`. La clave se fija en el design; estos endpoints ya existen.
- **Web · Inicio (`/dashboard`)**
  - Mismo orden de bloques que mobile, repartido en columnas: 3 desde 1280 px, 2 entre 1024 y 1279 px, 1 por debajo de 1024 px. Sin anchos fijos de 400 y 360 px.
  - «Tomar» es la única acción primaria. Subir, nueva cita y compartir quedan en acciones secundarias. No hay «Escanear».
  - Tarjeta de racha y estado «Todo al día». El check-in de la tarjeta abre la URL del check-in.
  - «Configura Helu» con la misma preferencia que mobile.
  - La cabecera de esta página no muestra racha ni nivel.
- **Web · Agenda (`/agenda`)**
  - Lista y detalle de citas. «Nueva cita» es secundaria, con «+». La primaria es la acción principal del detalle abierto.
  - Detalle alineado con mobile: «¿Pudiste asistir?» solo desde la hora de la cita, «Cómo llegar», «+ Agregar documento» y «Cancelar cita» como enlace rojo.
  - Medicamentos en «Activos» y «Finalizados», con alta en modal.
  - Formularios en una columna. Fecha y hora pueden ir en la misma fila. El modal mide 560 px de ancho y como máximo el alto de la ventana menos 48 px, con pie fijo.
  - Cada detalle y cada formulario tiene URL. Recargar reabre el modal. Atrás lo cierra y, si hay cambios, pregunta antes.
  - «Tomar» y «No la tomé» usan los mismos hooks que mobile. En web, «No la tomé» es un modal.
- **Web · pantallas que hoy no existen**
  - **Calendario:** pestaña de `/agenda`. Mes completo en grilla de 7 columnas iguales, panel «Hoy» de 340 px y, debajo de 1024 px, ese panel pasa abajo. Cada día muestra hasta 3 íconos por tipo y «+n». Leyenda visible: Tomas, Citas, Check-in y Tareas. El texto del evento vive en la lista del día. Ahí, «Tomar» es la acción urgente y «Completar» / «Reprogramar» de una tarea son secundarias.
  - **Bienestar:** pestaña de `/agenda`. Gráfico de ánimo en el que cada barra lleva su cara, con leyenda de las 5 etiquetas.
  - **Check-in:** tiene URL propia. Se dibuja como el modal de 560 px de `formularios.md` (5 caras con etiqueta). Lo abren la pestaña Bienestar y la tarjeta de racha de Inicio. Al guardar, toast con la racha.
  - **Detalle de ciclo:** URL propia, en el patrón lista + detalle de `web.md` §1. A 1280 px o más se ve junto a la lista de medicamentos. Entre 1024 y 1279 px, y por debajo, es una vista propia. Ofrece «Tomar» si hay una dosis pendiente. El progreso del ciclo va en verde.
  - **Nuevo profesional:** modal con URL, abierto desde el formulario de cita («+ Agregar nuevo profesional»). Una columna y pie fijo.
- **Cierre:** actualizar la tabla del ADR 0002 y `.docs/architecture/design-system.md`, y marcar la Fase 1 en el issue #35.

### Out of Scope

- Cualquier cambio de backend, contrato o endpoint nuevo.
- Misiones, pausas de racha, nivel, insignias y meta semanal.
- Recuperar contraseña y eliminar cuenta.
- Una pantalla de tareas separada en web. Las tareas se ven y se completan desde el calendario.
- Eventos de misiones en el calendario. La leyenda no incluye un módulo que este change no construye.
- La arquitectura nueva de la barra lateral (destinos, grupo «Más» y menú de cuenta). Sigue en la Fase 4. El corte a 1024 px sí entra, porque Inicio y Agenda lo necesitan.
- Documentos, mochilas, compartir, tratamientos, perfil, configuración y acceso, salvo el «+ Agregar documento» del detalle de una cita, que usa el vínculo que ya existe.
- Pasar los borrados recuperables a un toast con «Deshacer».
- Modo oscuro.
- Corregir `openspec/config.yaml`, que todavía dice Expo 54.

## Risks

| Riesgo | Mitigación |
|---|---|
| La ola, ahora con web y con pantallas nuevas, es grande para un solo PR | El issue pide un PR por ola y la web comparte hooks. Las pantallas solo conectan componentes. El design parte el trabajo en mobile, web existente y web nueva para poder revisarlo |
| Calendario, Bienestar, check-in, detalle de ciclo y profesional nuevo no tienen mockup web auditado | Se usa el contenido de `inicio-agenda.md` y el marco de `web.md`. El design anota cada decisión que el mockup no fija |
| Mover el corte de la barra lateral de 768 px a 1024 px afecta todas las rutas web | Es la regla de `web.md` §4. Se revisan Inicio y Agenda en 1280, 1024 y menos de 1024 |
| La cache optimista de una toma puede quedar vieja si falla el POST | `onError` restaura el snapshot y `onSettled` invalida medicamentos y calendario |
| Quitar el optimismo de revocar cambia una pantalla que el usuario ya conoce | La fila se va recién con la respuesta. Si el servidor rechaza, no desaparece |
| `BottomSheet` y el teclado en iOS se pisan | El primitivo reserva el inset del teclado y se prueba en el iPhone con Expo Go 58 |
| Darle URL a un modal de Next se puede hacer de más de una forma | El design elige entre ruta interceptada y parámetro de búsqueda. El proposal solo fija el comportamiento |
| La lista «Configura Helu» no tiene clave de preferencia documentada | El design elige una clave nueva sobre `setPreference`. No se inventa un endpoint |

## Success Criteria

- «Tomar» y el check-in se reflejan al instante en mobile y web, y vuelven atrás si el servidor falla.
- Revocar una delegación no saca la fila hasta que el servidor responde.
- «No la tomé» guarda `NOT_TAKEN` con un `notTakenReason` que ya acepta el schema.
- En web, Inicio tiene una sola primaria («Tomar») y Agenda cumple lista + detalle: «Nueva cita» es secundaria y el detalle tiene URL.
- En web, el calendario muestra el mes y la leyenda, Bienestar muestra las 5 caras, el check-in y el profesional nuevo tienen URL, y el detalle de ciclo también.
- Cada control nuevo mide al menos 44 px y el código nuevo no trae hex sueltos (`pnpm --filter @helu/ui check:tokens`).
- `pnpm exec tsc --noEmit -p apps/mobile` no suma errores nuevos frente a `dev`. `pnpm --filter @helu/web build` pasa.
- ADR 0002 y `.docs/architecture/design-system.md` quedan al día, y la Fase 1 del issue #35 queda marcada.
