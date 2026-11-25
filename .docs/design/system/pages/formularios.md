# Override · Formularios

> Manda sobre `MASTER.md` en todo formulario de Helu: acceso, citas, medicamentos, check-in, misiones, tratamientos, documentos, mochilas, compartir, dependientes, perfil y configuración. Vista previa: [`../formularios.html`](../formularios.html). Componentes a construir: [`../componentes.md`](../componentes.md).

## 1. Principios de formulario

1. **Pide solo lo necesario.** Si Helu ya lo sabe (fecha de la cita, prestador de la autorización, datos que leyó la IA), se precarga. El usuario confirma, no transcribe.
2. **Lo esencial primero.** Lo opcional va abajo, en una sección o detrás de «Más detalles» (divulgación progresiva).
3. **Toca en vez de escribir.** Para opciones conocidas (forma farmacéutica, recordatorios, motivo de no toma, ánimo, tipo de sangre) se usan chips o tarjetas, no listas desplegables ni texto libre.
4. **Errores que ayudan.** Se dice la causa y cómo arreglarlo, junto al campo y en el momento justo.
5. **Nunca se pierde lo escrito.** Hay confirmación al descartar, borrador en los formularios largos y reintento si falla la red.

## 2. Anatomía de un campo

```
Etiqueta (opcional)                     ← Nunito 800 13, siempre visible
┌─────────────────────────────────────┐
│ [ícono]  Valor o placeholder   [⋯]  │ ← 48 px de alto, radio 14
└─────────────────────────────────────┘
Texto de ayuda o error                    ← Inter 12; el error con ícono ⓘ y en rojo
```

| Parte | Regla |
|---|---|
| **Etiqueta** | Siempre visible. Es un sustantivo corto («Fecha», «Dosis por toma»). El placeholder **nunca** reemplaza la etiqueta. |
| **Obligatorio u opcional** | Se marca lo **opcional** con «(opcional)» en la etiqueta. No se usa asterisco; la mayoría de los campos de Helu son obligatorios. *Cambio: el formulario de cita hoy usa «Fecha \*», «Hora \*», «Lugar \*».* |
| **Placeholder** | Solo como ejemplo: «Ej: Hospital San José». Color `--color-text-muted` (#64748B, 4,76:1). |
| **Ícono inicial** | Opcional; ayuda a reconocer el tipo de dato (correo, teléfono, fecha, lugar). 18 px, color muted. |
| **Acción final** | Mostrar u ocultar contraseña, limpiar, abrir selector (chevron), unidad («mg», «min»). Área táctil ≥ 44 px. |
| **Ayuda** | Persistente debajo cuando el dato no es obvio («Usa al menos 8 caracteres», «Tu cuidador recibe los mismos recordatorios»). |
| **Error** | Reemplaza la ayuda. Ícono ⓘ + texto rojo `--color-danger-fg` + borde `--color-danger-solid`. Se anuncia con `role="alert"` o `accessibilityLiveRegion`. |
| **Contador** | Solo en textos con límite (notas, descripción): «120/500», a la derecha de la ayuda. |

## 3. Estados de un campo

| Estado | Borde | Fondo | Texto | Notas |
|---|---|---|---|---|
| Vacío | `--input-border` 1,5 px | `--input-bg` (#F8FAFC) | placeholder muted | — |
| Foco | `--input-border-focus` 2 px | superficie (blanco) | primario | Anillo de foco de 3 px en web con teclado |
| Lleno | `--input-border` | `--input-bg` | primario | — |
| Error | `--color-danger-solid` | `--color-danger-bg` al 40 % | primario | Mensaje bajo el campo |
| Validado | `--input-border` | `--input-bg` | primario | ✓ verde solo en campos con verificación real (correo de invitación, URL) |
| Deshabilitado | `--input-border` | `--color-surface-muted` | muted, opacidad 0,5 | `aria-disabled`; no recibe foco |
| Solo lectura | sin borde | transparente | primario | Dato con etiqueta encima y botón «Editar». **Distinto de deshabilitado.** |
| Precargado por IA | `--color-feature-ai-fg` al 40 % | `--color-feature-ai-bg` | primario | Chip «IA» a la derecha. Pasa a normal al editarlo. |

## 4. Qué control usar

| Dato | Control | Ejemplos en Helu |
|---|---|---|
| 2 o 3 opciones excluyentes, siempre visibles | **Control segmentado** | Tipo de consulta (cita médica / examen), modalidad, tema, estado del tratamiento |
| 3 a 8 opciones conocidas, una sola | **Chips de opción** (radio) | Forma farmacéutica, expiración del enlace, tipo de sangre, recordatorio de autorización; subtipo de una orden o autorización, con el ícono de la misión (v2.32) |
| Varias opciones conocidas | **Chips múltiples** (checkbox) | Recordatorios antes de la cita, síntomas, categorías del filtro |
| Elección con explicación | **Tarjeta de opción** (radio grande con ícono y descripción) | Nueva misión (subir orden / manual), invitar cuidador o dependiente, agregar a agenda |
| Hasta 8 opciones del servidor que conviene reconocer (v2.32) | **Selector con íconos y ayuda** (hoja sin búsqueda: ícono gris, nombre, ayuda corta, radio) | Tipo de documento |
| Muchas opciones o lista del servidor | **Selector** (hoja con búsqueda en móvil, desplegable en web; la búsqueda aparece con más de 8 opciones) | Especialidad, tratamiento |
| Elegir de una lista o crear uno nuevo | **Selector con creación** («+ Agregar nuevo …» como primera fila de la hoja, v2.32) | Profesional de salud |
| Encendido o apagado con efecto inmediato | **Interruptor en fila** | Permisos del enlace, avisar al cuidador, notificaciones |
| Seleccionar elementos de una lista | **Fila seleccionable** con casilla | Documentos para una mochila o para compartir |
| Fecha / hora | **Selector de fecha y hora** nativo | Cita, ciclo, check-in |
| Rango de fechas | **Dos fechas** «Desde / Hasta» o un selector de rango en web | Filtros, periodo del ciclo o del tratamiento |
| Cantidad pequeña | **Número con unidad** (o stepper − / +) | Dosis por toma, cada cuántas horas, duración |
| Unidad de una cantidad (v2) | **Se deduce** (de la forma farmacéutica) o chips; nunca un desplegable aparte | «1 tableta(s)»; frecuencia: Horas / Días / Semanas |
| Dinero | **Moneda** con prefijo «$» y separador de miles es-CO | Costo de la cita |
| Estado de ánimo | **Selector de ánimo** (5 caras con etiqueta) | Check-in |
| Archivo | **Zona de carga** con estados | Subir orden, autorización o resultados |
| Etiquetas | **Editor de etiquetas** (chips con ×, «+ Agregar», sugerencias) | Documentos |
| Texto largo | **Área de texto** de 3 líneas mínimo, crece hasta 6 | Notas, descripción |

**Regla:** no usar un desplegable para menos de 6 opciones fijas. Usar chips o segmentado.

### v2.32 · Cómo se ven los selectores

Decisión del 2026-11-24 entre las alternativas del módulo 13 de los mockups («Selectores de formulario»).

- **Selector de hasta 8 opciones (tipo de documento, «1B»):** la hoja muestra todas las opciones, sin búsqueda. Cada fila lleva un ícono gris (MASTER v2.1: en selectores, gris o azul), el nombre, una ayuda corta («Para un examen, terapia o cita») y un radio. «Otro documento» va al final. Con más de 8 opciones, la hoja suma la búsqueda.
- **Chips que deciden algo después (subtipo «Orden de» / «Autorización para», «2C»):** los chips llevan el ícono de lo que van a producir (el tipo de misión), en gris; el elegido cambia el ícono por ✓. Debajo, una ayuda persistente: «Con esto te sugerimos la misión correcta.» Tocar el elegido lo desmarca, porque el campo es opcional.
- **Especialidad de la cita («3B3»):** arriba de la lista, «Repetir una cita» con las parejas especialidad + profesional ya usadas (iniciales, «Con Dra. Ruiz · última el 3 dic»). Un toque llena los dos campos. Abajo, «Todas las especialidades» con búsqueda y filas con ícono y radio.
- **Profesional (selector con creación, «3C»):** «+ Agregar nuevo profesional» es la primera fila de la hoja, no un enlace suelto en el formulario. Cada profesional con sus iniciales y su especialidad; los de la especialidad elegida, arriba.

## 5. Estructura y layout

| Tamaño del formulario | Contenedor | Ejemplos |
|---|---|---|
| 1 a 5 campos, acción rápida | **Hoja inferior** (móvil) / **modal** de 560 px (web) | Registrar toma, check-in, paso de misión, invitar, filtros |
| 6 o más campos | **Pantalla completa** (móvil) / **modal** con cuerpo con scroll y pie fijo (web), con secciones. En web, página propia solo para Perfil y Configuración (ver [`web.md`](./web.md) §2) | Nueva cita, nuevo medicamento, subir documento, perfil |

- **Secciones:** tarjetas con título H3 («Información básica», «Modalidad y lugar», «Recordatorio», «Documentos y mochilas», «Detalles adicionales»). Separación de 16 px entre secciones y 12 px entre campos.
- **Una columna, en móvil y en web.** Dos campos en una fila solo si son cortos y relacionados: fecha + hora, dosis + unidad, inicio + fin.
- **Web:** ancho de lectura máximo de 720 px en páginas. *(v2.8: antes se permitían dos columnas dentro del modal web; ver [`web.md`](./web.md) §6.)*
- **Acción principal:**
  - pantalla completa móvil: **siempre** una barra fija inferior con el botón primario («Guardar cita»); el «Guardar» de la cabecera es opcional *(v2: antes solo en formularios largos, y casi ningún mockup la tenía)*
  - hoja: botón ancho al final
  - modal web: pie alineado a la derecha, «Cancelar» (secundario) + acción (primario)
- **El botón dice qué hace:** «Guardar cita», «Crear mochila», «Generar enlace», «Enviar invitación». No usar «Aceptar» ni «OK».
- **Acción destructiva** separada y en rojo, al final: «Eliminar mochila», nunca junto a «Guardar» ni en la barra inferior. Se muestra como enlace rojo con ícono.
- **Más detalles (v2):** en formularios de 6 o más campos, los opcionales van plegados en una fila «Más detalles (opcional)» que dice qué contiene («Documentos, tratamiento, notas y costo»).
- **Teclado (móvil):** `KeyboardAvoidingView` o scroll al campo con foco; `returnKeyType="next"` encadena los campos y el último usa `done`; nunca dejar el botón de guardar oculto bajo el teclado.

## 6. Validación

| Momento | Qué pasa |
|---|---|
| Al escribir | Nada, salvo el contador y la máscara (teléfono, moneda). |
| Al salir del campo | Valida formato y obligatoriedad, y muestra el error en línea. |
| Al corregir un campo con error | El error desaparece en cuanto el valor es válido (validación en vivo **solo** después del primer error). |
| Al enviar | Valida todo. **Sin resumen de errores arriba** (v2.6): cada campo inválido muestra su error debajo. La pantalla baja hasta el **primer campo con error** y le pasa el foco; el lector de pantalla lee la etiqueta y el error (`aria-describedby` en web, `accessibilityHint` en móvil) y anuncia cuántos campos faltan («Revisa 2 campos») por una región `aria-live` que no se ve. |
| Error del servidor 422 | Se mapean `fieldErrors` de `ApiError` a cada campo (`@helu/api` ya los normaliza). |
| Error de red o 5xx | Banner en el formulario: «No pudimos guardar. Revisa tu conexión e intenta de nuevo.» + «Reintentar». **Lo escrito se conserva.** |

**Mensajes de error (causa + cómo arreglar):**

| Caso | Mensaje |
|---|---|
| Obligatorio vacío | «Escribe el nombre del medicamento.» / «Elige la fecha de la cita.» |
| Correo inválido | «Revisa el correo: debe tener la forma nombre@ejemplo.com.» |
| Contraseña corta | «Usa al menos 8 caracteres.» |
| Fecha en el pasado (cita) | «La cita debe ser hoy o una fecha futura.» |
| Fin antes de inicio | «La fecha de fin debe ser después del inicio.» |
| Archivo muy grande | «El archivo pesa 14 MB. El máximo es 10 MB.» |
| URL inválida | «Revisa el enlace: debe empezar por https://.» |
| Credenciales | «Correo o contraseña incorrectos. Revisa e intenta de nuevo.» Va en un banner arriba del formulario, sin señalar cuál de los dos falló. |

Prohibido: «Campo inválido», «Error», mensajes en inglés del backend o solo un borde rojo.

## 7. Envío y respuesta

1. **Enviando:** el botón muestra un spinner y su texto en gerundio («Guardando…», «Creando…», «Enviando…»), queda deshabilitado y se evita el doble envío. Los campos siguen visibles.
2. **Éxito:**
   - se cierra la hoja o se vuelve atrás
   - aparece un toast de confirmación con lo que pasó («Cita guardada», «Toma registrada a las 1:05 p. m.») durante 3 a 5 segundos; no roba el foco y se anuncia en `aria-live="polite"`
   - si se puede deshacer, el toast incluye «Deshacer» (por ejemplo, al quitar un documento de una mochila)
3. **Éxito con motivación:** check-in, toma o paso de misión suman a la racha o al nivel según `MASTER.md` §8, **después** de que el servidor confirme.
4. **Descartar:** si hay cambios sin guardar y el usuario cierra la hoja, el modal o la pantalla, aparece «¿Descartar los cambios?» con «Seguir editando» (primario) y «Descartar» (peligro).
5. **Borrador:** nueva cita, subir documento y perfil guardan un borrador local mientras se escribe, y lo ofrecen al volver: «Tienes un borrador de cita sin guardar».

## 8. Entrada de datos (móvil y web)

| Dato | Teclado / atributo | Autocompletar |
|---|---|---|
| Correo | `keyboardType="email-address"`, `autoCapitalize="none"` | `autoComplete="email"` / `textContentType="emailAddress"` |
| Contraseña | `secureTextEntry` + mostrar u ocultar | `password` (login) / `new-password` (registro) |
| Teléfono | `phone-pad`, prefijo +57 | `tel` |
| Números (dosis, horas) | `number-pad` | — |
| Moneda | `number-pad`, formato «$ 45.000» | — |
| Nombre | `autoCapitalize="words"` | `name` |
| URL del portal | `url`, `autoCapitalize="none"` | `url` |
| Fecha y hora | Selector nativo (iOS rueda o calendario, Android diálogo); web `input type="date"` con estilo propio | — |

Formato local: fechas «Jue 5 nov 2026», horas «10:00 a. m.», moneda «$ 45.000», decimales con coma.

## 9. Accesibilidad específica

- [ ] Cada campo tiene etiqueta asociada (`<label for>` / `accessibilityLabel`) y la ayuda o el error enlazados (`aria-describedby` / `accessibilityHint`).
- [ ] Chips y tarjetas de opción exponen su rol y estado: `radio` / `checkbox` + `checked`; segmentado como `radiogroup`.
- [ ] Interruptores con `role="switch"` y su etiqueta textual. Nunca un interruptor sin texto.
- [ ] El selector de ánimo anuncia «Bien, 4 de 5» y no depende solo del color.
- [ ] La zona de carga es operable por teclado y anuncia el progreso («Subiendo, 50 %», «La IA está leyendo el documento»).
- [ ] Alto mínimo de 48 px en campos y de 44 px en chips, segmentados y botones `sm`, con ≥ 8 px entre sí.
- [ ] Al fallar el envío, no hay resumen arriba: la pantalla baja al primer campo inválido y le pasa el foco.
- [ ] Con el tamaño de texto al 130 %, las etiquetas pueden pasar a dos líneas y nada se corta.

## 10. Microcopy de formularios

- **Etiquetas:** sustantivo; **ayudas:** frase corta; **botones:** verbo + objeto.
- Preguntas cuando la decisión es del usuario: «¿Tomaste esta dosis?», «¿Cuándo te recordamos?», «¿Algún síntoma?».
- Tuteo siempre. Nada de «Ingresá», «Seleccioná», «Creá» (hoy aparecen en el código).
- Fechas relativas cuando ayudan: «Mañana 9:00 a. m.», «En 2 días».
