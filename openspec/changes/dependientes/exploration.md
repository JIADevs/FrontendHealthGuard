# Exploración: Dependientes (delegación de pacientes / gestión de cuidadores)

**Change name**: `dependientes`  
**Fecha**: 2026-06-23  
**Alcance**: Mobile-first + `packages/api` + `packages/stores`. Backend ya implementado (cambios menores documentados aparte). Web [deferred].

---

## Estado actual

### Backend — Completo

El backend ya está implementado. Artefactos clave:

| Archivo | Qué hace |
|---------|----------|
| `BackendHealthGuard/app/models/user.py` | Modelo `UserDelegation`: `manager_user_id`, `dependent_user_id`, `status` (PENDING\|ACTIVE\|REJECTED), `permissions` (READ_ONLY\|FULL_ACCESS), `linked_user_email`, `created_at`, `revoked_at` |
| `BackendHealthGuard/app/crud/crud_delegation.py` | CRUD: `get_by_users`, `get_managed_users`, `get_managers`, `get_active_manager_ids`, `update_status`, `revoke` (establece `status=REVOKED`) |
| `BackendHealthGuard/app/api/api_v1/endpoints/users.py` | 5 endpoints (ver tabla) |
| `BackendHealthGuard/app/api/deps.py` | `get_current_active_user` hace el swap de identidad con `X-Patient-Context` válido |
| `BackendHealthGuard/tests/api/test_users.py` | Cubre auto-invitación, usuario inexistente, ciclo de vida (crear/listar/seguridad/eliminar) |

**Endpoints del backend:**

| Método | Ruta | Guard de auth | Descripción |
|--------|------|---------------|-------------|
| POST | `/users/me/delegations` | `get_current_user` (sin context switch) | Enviar invitación por email + dirección de relación + permisos |
| GET | `/users/me/delegations/managed` | `get_current_user` | Listar dependientes que gestiono (`DependentDelegation[]`) |
| GET | `/users/me/delegations/managers` | `get_current_user` | Listar mis gestores (`ManagerDelegation[]`) |
| PATCH | `/users/me/delegations/{id}/status?action=accept\|reject` | `get_current_user` | Aceptar/rechazar — solo `linked_user_email` puede responder |
| DELETE | `/users/me/delegations/{id}` | `get_current_user` | Revocar — cualquiera de las dos partes puede revocar |

**Cambio de contexto (ya funciona):**

`deps.get_current_active_user` valida el header `X-Patient-Context` contra la tabla `user_delegations`. Si existe una delegación ACTIVE donde el usuario del token es el manager, el dependency devuelve el **objeto User del paciente**. Todos los endpoints posteriores se comportan como si el paciente hubiera hecho la petición. El header se inyecta automáticamente en `packages/api/src/client.ts` desde `authStore.activePatientId`.

### Frontend — Solo infraestructura, sin UI

| Archivo | Estado | Qué hay |
|---------|--------|---------|
| `packages/stores/src/authStore.ts` | ✅ Listo | `activePatientId`, `isManaging`, `setPatientContext`, `useIsManaging` |
| `packages/api/src/client.ts` | ✅ Listo | Interceptor de request inyecta `X-Patient-Context` desde `activePatientId` |
| `apps/mobile/App.tsx` | ✅ Listo | `setApiAuthProviders` conecta `getPatientContext` al store |
| `packages/api/src/schemas.ts` | ❌ Falta | Sin `UserDelegationSchema`, `DependentDelegationSchema`, `ManagerDelegationSchema` |
| `packages/api/src/endpoints.ts` | ❌ Falta | Sin funciones API de delegación |
| `packages/api/src/hooks.ts` | ❌ Falta | Sin hooks de query/mutation de delegación |
| `apps/mobile/src/screens/` | ❌ Falta | Sin pantallas de gestión de dependientes |
| `apps/mobile/src/navigation/RootNavigator.tsx` | ❌ Falta | Sin rutas de delegación en `RootStackParamList` |
| `apps/mobile/src/screens/MoreScreen.tsx` | ⚠️ Stub | Ítem "Dependientes" existe pero llama a `showComingSoon` |
| `apps/web/src/app/(app)/` | ❌ Falta | Sin ruta `/dependientes` [web-deferred] |
| `apps/web/src/app/(app)/layout.tsx` | ❌ Falta | Sin entrada de navegación [web-deferred] |

---

## Áreas afectadas

### Backend (fuera del repo frontend; documentado para coordinación)

- `BackendHealthGuard/app/api/api_v1/endpoints/users.py` — falta enforcement de READ_ONLY (ver Riesgos)
- `BackendHealthGuard/tests/api/test_users.py` — falta test del path `accept` y de enforcement READ_ONLY

### Paquetes compartidos (`packages/*`)

- `packages/api/src/schemas.ts` — agregar schemas de delegación
- `packages/api/src/endpoints.ts` — agregar 5 funciones API
- `packages/api/src/hooks.ts` — agregar `useManagedUsersQuery`, `useManagersQuery`, `useCreateDelegationMutation`, `useRespondDelegationMutation`, `useRevokeDelegationMutation`
- `packages/api/src/index.ts` — exportar nuevos tipos
- `packages/stores/src/authStore.ts` — extender `setPatientContext` para limpiar cache de TanStack Query

### Mobile

- `apps/mobile/src/navigation/RootNavigator.tsx` — agregar `Dependientes`, `DependientesInvite` a `RootStackParamList`
- `apps/mobile/src/screens/MoreScreen.tsx` — conectar "Dependientes" a pantalla real
- Nuevos componentes: `DependientesScreen`, `DependientesInviteScreen`, `DelegationInviteModeSheet`, tarjetas y selector de color en `apps/mobile/src/components/dependientes/`
- `TabNavigator.tsx` — `CenterTabIcon` con iniciales + contorno cuando `isManaging`

### Web [deferred]

- `apps/web/src/app/(app)/dependientes/page.tsx`
- `apps/web/src/app/(app)/layout.tsx` — entrada de navegación

### Preocupación transversal: invalidación de queries al cambiar contexto

Cuando se llama a `setPatientContext`, **toda** la cache de TanStack Query debe limpiarse porque cada dominio (citas, medicamentos, documentos, etc.) pasa a pertenecer a otro paciente. Hoy no está cableado `queryClient.clear()` ni equivalente al cambiar contexto.

---

## Enfoques

### Enfoque 1: Slice solo frontend (sin cambios de backend)

Implementar toda la UI y la capa API del cliente. Dejar READ_ONLY como gap conocido documentado.

- **Pros**: Entrega UI funcional rápido; READ_ONLY es secundario (la mayoría de invitaciones usan FULL_ACCESS); sin riesgo en backend
- **Contras**: READ_ONLY aparece en el schema pero no se respeta — gap de seguridad si el usuario confía en ese nivel; `REVOKED` devuelto por CRUD pero el comentario del modelo solo menciona PENDING\|ACTIVE\|REJECTED
- **Esfuerzo**: Medio (3–4 días)

### Enfoque 2: Slice completo cross-cutting (READ_ONLY en backend + frontend completo)

Agregar enforcement de READ_ONLY en `deps.py` / middleware y luego construir todo el frontend.

- **Pros**: Feature completa y honesta con los permisos; sin gap silencioso de seguridad
- **Contras**: El cambio de backend toca `get_current_active_user`, usado por todos los endpoints; mayor costo de coordinación
- **Esfuerzo**: Medio-alto (4–6 días)

### Enfoque 3: Solo frontend, MVP con FULL_ACCESS (recomendado — **adoptado**)

Implementar UI y capa API del cliente. Invitaciones siempre con `FULL_ACCESS`; no mostrar selector de permisos. READ_ONLY queda para un change backend futuro.

- **Pros**: Sin promesa falsa al usuario; un solo PR frontend; alineado con decisión de producto
- **Contras**: READ_ONLY sigue sin enforcement en backend (irrelevante mientras la UI no lo ofrezca)
- **Esfuerzo**: Medio (3–4 días)

---

## Opciones de UX para el selector de paciente

### Opción A: Banner persistente superior

Banner visible en todas las tabs cuando `isManaging === true`, mostrando "Gestionando: [nombre]" con botón "Salir".

- **Pros**: Imposible olvidar que estás en cuenta ajena; alineado con seguridad clínica
- **Contras**: Reduce espacio vertical; requiere layout compartido (TabNavigator)
- **Esfuerzo**: Medio

### Opción B: Dropdown en avatar/perfil

Al tocar el avatar, menú con "Cambiar a [paciente]".

- **Pros**: Huella mínima; patrón familiar
- **Contras**: Menos visible; el manager puede olvidar el contexto activo
- **Esfuerzo**: Bajo

### Opción C: Selector solo desde pantalla Dependientes

El usuario entra a Dependientes y toca una tarjeta para "cambiar a" ese paciente.

- **Pros**: Modelo mental claro
- **Contras**: No accesible desde otras pantallas; contexto poco obvio a mitad de tarea
- **Esfuerzo**: Bajo (la pantalla ya es necesaria)

**Recomendación original**: Opción A (banner persistente). **Adoptado para MVP**: ver sección siguiente.

### Opción adoptada (MVP): Iniciales en tab Inicio + contorno; cambio solo desde Dependientes

**Tab central (Inicio)** — siempre abre el **dashboard** (`HomeScreen`). Con contexto activo, el dashboard muestra datos del dependiente (vía `X-Patient-Context`). El botón central **no** abre selector ni bottom sheet.

Cuando `isManaging === true`, el círculo elevado del tab muestra las **iniciales del dependiente** y un **contorno de color** (elegido en Dependientes; ver abajo). Sin `LayoutDashboard` mientras hay contexto activo.

**Cambiar de dependiente o volver a mi cuenta** — únicamente desde **Más → Dependientes**: lista de gestionados, tap en tarjeta para activar contexto, acción explícita “Mi cuenta” para salir.

- **Pros**: Un solo lugar para gestionar relaciones y contexto; tab Inicio conserva semántica de dashboard; implementación simple en `TabNavigator`
- **Contras**: Cambiar de paciente requiere ir a Más (más taps); sin atajo desde tab bar
- **Esfuerzo**: Bajo–medio (`CenterTabIcon` + `DependientesScreen` como único switcher)
- **Fuera de alcance MVP**: banner global, banner en modales, bottom sheet desde tab central, long-press en tab, selector de paciente fuera de Dependientes

**Comportamiento:**

| Acción | Resultado |
|--------|-----------|
| Tap tab Inicio (cuenta propia) | Dashboard del manager; ícono `LayoutDashboard` |
| Tap tab Inicio (gestionando) | Dashboard del **paciente activo**; iniciales + contorno de color en el círculo |
| Cambiar paciente | Más → Dependientes → tap en otro dependiente → `setPatientContext` + `queryClient.clear()` |
| Salir de modo gestión | Más → Dependientes → “Mi cuenta” |

**Color del contorno por paciente** (decisión complementaria): paleta cerrada del design system; el manager elige color en la pantalla Dependientes; persistencia vía `PUT /users/me/preferences/delegation_context_colors` (mapa `dependentId → colorToken`). Default por índice si no hay elección.

El label del tab sigue siendo **"Inicio"** en MVP.

## Flujo de invitación

Solo hay invitación por email (`DelegationRequest.email` + `relationship`). No existe flujo por enlace. El campo `relationship` define quién es manager y quién dependiente:

- `I_WANT_TO_MANAGE_THEM` → usuario actual = manager, destino = dependiente
- `THEY_WILL_MANAGE_ME` → destino = manager, usuario actual = dependiente

El invitado (`linked_user_email`) debe aceptar vía `PATCH /me/delegations/{id}/status?action=accept`. No hay notificación push al crear la invitación — el invitado debe descubrir la solicitud pendiente abriendo Dependientes.

**Gap**: Sin push al recibir invitación. Mitigación MVP: badge en el ítem "Dependientes" del menú con conteo de invitaciones PENDING.

### UI de invitación (adoptado): un botón + bottom sheet de modo

Un **único** botón primario **“Invitar”** (FAB fijo o fila al pie de `DependientesScreen`). Al tocarlo se abre un **menú desde abajo** (mismo patrón que `AgendaMenuSheet`: `Modal` + `animationType="slide"` + handle).

**Opciones del sheet:**

| Opción | `relationship` | Copy sugerido |
|--------|----------------|---------------|
| Gestionar a otra persona | `I_WANT_TO_MANAGE_THEM` | “Invitar dependiente” — “Voy a gestionar la cuenta de otra persona” |
| Que me gestionen | `THEY_WILL_MANAGE_ME` | “Invitar cuidador” — “Otra persona gestionará mi cuenta” |

Tras elegir modo → navegar a `DependientesInviteScreen` (o sheet de segundo nivel) con campo email; el modo ya viene fijado. MVP: siempre `FULL_ACCESS`, sin selector de permisos.

**Pantalla Dependientes — usuario solo dependiente** (sin gestionados): mismas secciones (“Quién gestiona mi cuenta”, empty “Personas que gestiono”), **un solo botón Invitar** que abre el mismo sheet (ambas opciones disponibles).

Componente nuevo: `DelegationInviteModeSheet` en `apps/mobile/src/components/dependientes/`.

## Límites de slice (¿requiere backend?)

| Feature | ¿Requiere backend? | Notas |
|---------|-------------------|-------|
| Ver dependientes que gestiono | No | Endpoint existe |
| Ver mis gestores | No | Endpoint existe |
| Enviar invitación | No | Endpoint existe |
| Aceptar/rechazar invitación | No | Endpoint existe |
| Revocar delegación | No | Endpoint existe |
| Cambiar contexto de paciente | No | Solo desde pantalla Dependientes (Más); `queryClient.clear()` al cambiar |
| Color de contorno por dependiente | No | Preferencia `delegation_context_colors` en `users/me/preferences`; UI en Dependientes |
| Indicador en tab Inicio (iniciales + contorno) | No | `CenterTabIcon`; tap sigue yendo al dashboard del contexto activo |
| Enforcement READ_ONLY | **Sí** | Check de permisos en endpoints o `get_current_active_user` |
| Push al recibir invitación | **Sí** | Trigger backend (Firebase) — fuera de MVP |
| Badge de invitaciones pendientes | No | Contar PENDING desde GET existente |

---

## Recomendación

**Enfoque 3 (adoptado)** — Un PR frontend: UI + cliente API, invitaciones fijas en `FULL_ACCESS`.

1. Schemas + endpoints + hooks en `packages/api` (request de invitación hardcodea o defaultea `FULL_ACCESS`).
2. Pantalla **Dependientes** (Más): listar gestionados/gestores, invitar, aceptar/rechazar, revocar, **cambiar contexto**, elegir color de contorno, “Mi cuenta”.
3. **Tab Inicio**: iniciales + contorno del paciente activo; navegación normal al dashboard. Cablear `queryClient.clear()` al cambiar contexto.

**Fuera de alcance MVP:** selector READ_ONLY/FULL_ACCESS, enforcement backend de READ_ONLY, push en invitación, banner en tabs/modales, bottom sheet / atajo de cambio desde tab central.

La invalidación de queries al cambiar contexto es el **riesgo de ingeniería más crítico** — debe entrar en este PR o la app mostrará datos cacheados del paciente anterior.

---

## Riesgos y mitigaciones

Cada riesgo incluye severidad, acciones recomendadas para el MVP y criterio de verificación donde aplica.

### R1 — Cache de TanStack Query al cambiar contexto

| | |
|---|---|
| **Severidad** | **Crítica** (confidencialidad / seguridad del paciente) |
| **Problema** | `setPatientContext` solo actualiza `authStore`. Las query keys **no incluyen** `activePatientId`; el header `X-Patient-Context` cambia pero la UI puede seguir mostrando datos cacheados del paciente o cuenta anterior (`staleTime` 5s–30s, algunas `Infinity`). Mutaciones posteriores sí irían al paciente nuevo → mezcla peligrosa. |
| **Acciones recomendadas** | 1. Implementar `switchPatientContext(patientId)` (o extender `setPatientContext`) que llame `queryClient.clear()` **antes o después** del `set` del store, también en “Mi cuenta” (`null`). 2. Centralizar en un solo lugar (no repetir en cada pantalla). 3. *Opcional post-MVP:* incluir `activePatientId` en query keys como defensa en profundidad. **No usar solo** `invalidateQueries()` — puede mostrar data vieja mientras refetch. |
| **Verificación** | **Bloqueante en verify:** cambiar de cuenta propia → paciente A → paciente B → “Mi cuenta”; en Documentos/Agenda/Inicio la lista debe corresponder al contexto activo sin datos del contexto anterior. |

### R2 — `READ_ONLY` almacenado pero no enforced en backend

| | |
|---|---|
| **Severidad** | Media (mitigada en MVP) |
| **Problema** | El campo `permissions` existe en `UserDelegation` pero `get_current_active_user` no lo evalúa; un manager `READ_ONLY` podría escribir datos del dependiente. |
| **Acciones recomendadas** | 1. UI e invitaciones: **siempre** enviar `FULL_ACCESS`; no mostrar selector de permisos. 2. Documentar gap en backend para change futuro (`deps` o middleware que bloquee POST/PATCH/DELETE con contexto `READ_ONLY`). 3. No prometer “solo lectura” en copy de producto. |
| **Verificación** | Confirmar que `DelegationRequest` del cliente nunca envía `READ_ONLY`. |

### R3 — Estado `REVOKED` vs schema / Zod

| | |
|---|---|
| **Severidad** | Media |
| **Problema** | Comentario del modelo: `PENDING \| ACTIVE \| REJECTED`. `revoke()` setea `REVOKED`. `REJECTED` ≠ `REVOKED` (rechazo de invitación vs revocación de relación). Listados backend excluyen `REVOKED` (`status != "REVOKED"`), pero un `z.enum` estricto sin `REVOKED` rompe el parse si llega ese valor. |
| **Acciones recomendadas** | 1. Zod: `status: z.enum(["PENDING", "ACTIVE", "REJECTED", "REVOKED"])`. 2. En UI de listas operativas, mostrar solo `ACTIVE` y `PENDING` (filtrar `REJECTED` en cliente si el backend lo devuelve). 3. Tras `revoke` mutation, invalidar queries de delegaciones. |
| **Verificación** | Parse exitoso de respuestas de `GET /managed` y `GET /managers`; flujo revocar no deja filas rotas en UI. |

### R4 — Sin tests backend del path `accept` + context switch

| | |
|---|---|
| **Severidad** | Media (backend; no bloquea frontend MVP) |
| **Problema** | `test_full_delegation_lifecycle` no cubre aceptación → `ACTIVE` → uso de `X-Patient-Context` de punta a punta. |
| **Acciones recomendadas** | 1. Añadir test en `BackendHealthGuard/tests/api/test_users.py` o extender tests de dominio (symptoms/appointments): invitar → accept → GET con header → 200. 2. Puede ir en PR frontend o follow-up backend pequeño. |
| **Verificación** | `pytest` del nuevo test en CI / `run_tests.sh`. |

### R5 — Sin push al crear invitación

| | |
|---|---|
| **Severidad** | Media (producto / adopción) |
| **Problema** | `POST /delegations` no dispara push ni notificación in-app automática. El invitado puede no enterarse hasta que abre la app y Más → Dependientes. |
| **Acciones recomendadas** | 1. **Badge** en ítem “Dependientes” (Más): contar delegaciones `PENDING` donde `linked_user_email === email` del usuario actual (solicitudes que **debe** aceptar/rechazar). 2. Sección **“Solicitudes pendientes”** al tope de `DependientesScreen`. 3. `useFocusEffect` + refetch de `managed`/`managers` al entrar a Dependientes y al volver a foreground. 4. Documentar en propose/spec que push queda **fuera de MVP** (change futuro: tipo `DELEGATION_INVITE` + FCM). |
| **Verificación** | Con invitación pendiente, badge visible en Más; al aceptar/rechazar, badge desaparece tras refetch. |

### R6 — Web sin UI de dependientes

| | |
|---|---|
| **Severidad** | Baja (alcance explícito) |
| **Problema** | Solo mobile implementa gestión; web no tiene ruta ni nav. |
| **Acciones recomendadas** | 1. Marcar tareas y specs con `[web-deferred]`. 2. Asegurar que `packages/api` y stores sirvan para web en un change posterior. |
| **Verificación** | N/A en verify de este change. |

### R7 — Persistencia de `activePatientId` entre reinicios

| | |
|---|---|
| **Severidad** | Media (producto) |
| **Problema** | `activePatientId` está en `partialize` del auth store persistido. Al cerrar y reabrir la app, el manager puede retomar contexto de gestión sin pasar por Dependientes. |
| **Acciones recomendadas** | **Decisión de producto pendiente.** Opciones: (A) **Persistir** — comportamiento actual, conveniente para cuidadores frecuentes; validar en arranque que la delegación sigue `ACTIVE`. (B) **Limpiar al cold start** — `activePatientId: null` en rehydrate; más seguro, más taps. Al decidir, documentar en spec y aplicar en `onRehydrateStorage` o bootstrap de `App.tsx`. |
| **Verificación** | Caso de prueba manual según decisión tomada en propose. |

### R8 — Sin indicador de contexto en pantallas stack/modal

| | |
|---|---|
| **Severidad** | Media (aceptada en MVP) |
| **Problema** | `DocumentUpload`, `Scanner`, `DocumentDetail`, etc. ocultan el tab bar. El indicador (iniciales + contorno en tab Inicio) no es visible; el usuario puede olvidar que opera en cuenta ajena durante subida/edición. |
| **Acciones recomendadas** | 1. **Aceptar en MVP** con riesgo documentado. 2. En verify: checklist manual en al menos un modal (subir documento) con contexto activo. 3. *Follow-up:* banner compacto o chip en header de stack screens cuando `isManaging`. |
| **Verificación** | Documentar en test plan; no bloqueante si producto confirma alcance MVP. |

### Resumen de prioridad en implementación

| Prioridad | Riesgo | Acción mínima obligatoria |
|-----------|--------|---------------------------|
| P0 | R1 | `queryClient.clear()` en cada cambio de contexto |
| P1 | R3, R5 | Zod con 4 estados; badge + sección pendientes + refetch al foco |
| P1 | R2 | Solo `FULL_ACCESS` en UI |
| P2 | R4, R7, R8 | Tests backend accept; decisión persistencia; follow-up modales |
| — | R6 | Deferred por alcance |

---

## Listo para propuesta

**Sí.** Backend cubierto; frontend por construir. Riesgos documentados en **R1–R8** con mitigaciones y prioridades (R1 bloqueante en verify).

**Decisiones de producto:**

| Decisión | Resolución |
|----------|------------|
| Nivel de permisos en MVP | **Solo `FULL_ACCESS`**. |
| Cambio de dependiente | **Solo Más → Dependientes**. Tab Inicio no abre selector. |
| Tab Inicio en modo gestión | **Dashboard del paciente activo**; círculo con iniciales + contorno de color (no cambia de pantalla especial). |
| Color del contorno | Paleta cerrada; elegir en Dependientes; persistir en `preferences/delegation_context_colors`. |
| Invitaciones | **Un botón “Invitar”** → bottom sheet con modo (dependiente vs cuidador) → pantalla email. |
| Persistencia de `activePatientId` al reiniciar app | **Opción B — limpiar en cold start** (`activePatientId: null` en rehydrate; siempre arranca en cuenta propia) |
