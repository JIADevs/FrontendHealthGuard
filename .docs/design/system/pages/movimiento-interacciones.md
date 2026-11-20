# Override · Movimiento, transiciones e interacciones

> Manda sobre `MASTER.md` §10 para todo lo que se mueve o responde al usuario: transiciones entre pantallas, hojas y modales, botones, controles, feedback de acciones y momentos de motivación. Vista previa interactiva: [`../movimiento.html`](../movimiento.html). Estados de carga: §6c.

## 1. Para qué se mueve algo en Helu

El movimiento **comunica**, no decora. Cada animación responde a una de estas cuatro preguntas; si no responde ninguna, no se anima.

| Pregunta del usuario | Lo que comunica el movimiento | Ejemplo |
|---|---|---|
| **¿Me escuchó?** | Respuesta inmediata al toque | El botón baja 3 px; el chip se marca |
| **¿Dónde estoy?** | Continuidad espacial | El detalle entra desde la derecha; la hoja sube desde abajo |
| **¿Qué cambió?** | El estado nuevo | La toma pasa de «Tomar» a «✓ Tomado»; el nodo se pone verde |
| **¿Funcionó?** | El resultado | Toast «Cita guardada»; la llama crece al sumar el día |

Público adulto y mayor en contexto de salud: movimiento **corto, suave y predecible**. Nada que maree, nada que distraiga de un dato clínico.

## 2. Tokens de movimiento

| Token | Valor | Uso |
|---|---|---|
| `--motion-instant` | 100 ms | Color o fondo al presionar, cambio de check |
| `--motion-fast` | 150 ms | Botón presionado, interruptor, salida de toast |
| `--motion-base` | 250 ms | Chips, pestañas, fundido de contenido, entrada de toast |
| `--motion-slow` | 350 ms | Pantallas (push/pop), hojas y modales al entrar |
| `--motion-emphasis` | 600–900 ms | Desbloqueo de paso, llama de racha, anillo de progreso |
| `--motion-celebration` | ≤ 1 200 ms | Celebración de misión (una vez) |
| `--motion-ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | **Entrar**: desacelera al llegar |
| `--motion-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | **Salir**: acelera al irse |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Cambios dentro de la misma pantalla |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Rebote corto solo en confirmaciones positivas (chip, nodo, insignia) |
| Resorte nativo | `damping 18 · stiffness 220 · mass 1` | Hojas y gestos en móvil (Reanimated) |

**Reglas de duración:**
- **Salir dura entre el 60 y el 70 % de entrar.** La hoja entra en 350 ms y sale en 220 ms.
- **«Fundido cruzado» = *fade through*** cuando cambia el contenido dentro de una pantalla (pestañas internas, «Tomar» → «✓ Tomado», un banner que pasa de error a éxito): el contenido anterior **sale** con fundido en 100 ms (`--motion-instant`, lineal) y **después entra** el nuevo en 150 ms. Si es una vista completa (las pestañas internas de Agenda), entra en 250 ms subiendo 4 px (`--motion-ease-standard`). **Nunca hay dos contenidos encimados**: tienen alturas distintas y se leerían uno sobre otro. Si se toca otra pestaña a mitad de camino, la animación se corta y entra directo la última elegida. Entre pantallas completas (barra inferior) sí vale el fundido simultáneo del navegador (`animation: 'fade'`), porque cada pantalla cubre todo el fondo.
- Escalonado de listas: 40 ms por elemento, máximo 6 elementos; el resto aparece de una vez.
- Máximo **1 o 2 elementos animados a la vez** por pantalla.

## 3. Transiciones entre pantallas

| Navegación | Móvil (React Navigation) | Web (Next.js) | Por qué |
|---|---|---|---|
| **Avanzar a un detalle** (cita, documento, ciclo, misión) | `slide_from_right` (nativo), 350 ms | Fundido + 8 px hacia arriba, 250 ms | Más profundo = desde la derecha |
| **Volver** | Desliza a la derecha + gesto de borde (iOS) / botón atrás (Android) | Fundido, 150 ms | Dirección inversa; nunca bloquear el gesto del sistema |
| **Cambiar de pestaña** (Documentos, Agenda, Inicio, Mochilas, Más) | Fundido cruzado de 150 ms, **sin** deslizar | Cambio inmediato + resaltado de la barra lateral (150 ms) | Las pestañas son hermanas, no hay jerarquía |
| **Pestañas internas** (Calendario, Citas, Medicamentos, Bienestar) | El indicador del segmentado se desliza 250 ms; el contenido hace *fade through*: sale en 100 ms y entra en 250 ms subiendo 4 px | Igual | Mismo contenedor, otro contenido. Sin deslizar de lado (eso significa «bajé un nivel») y sin dos listas encimadas |
| **Formulario de creación** (nueva cita, nuevo medicamento) | `slide_from_bottom` / `fullScreenModal`, 350 ms | Modal de 560 px: escala 0,96 → 1 + fundido, 250 ms | Es una tarea temporal que se cierra hacia abajo |
| **Acción rápida** (toma, check-in, paso de misión, filtros) | Hoja inferior con resorte; fondo oscuro con fundido de 250 ms | Modal centrado | Sale desde donde se tocó (abajo) |
| **Celebración** | Fundido + escala 0,9 → 1 de la mascota | Igual | Momento especial, sin desplazar |
| **Abrir desde una notificación** | Directo a la pantalla, con la hoja de acción abierta (por ejemplo «¿Tomaste esta dosis?») | — | El push lleva al flujo, no a la bandeja |
| **Entrar o salir del modo gestión** | Fundido de 250 ms + el banner de color entra desde arriba | Igual | Cambio de contexto visible e inequívoco |
| **Carga de pantalla** | Esqueleto inmediato (si no hay datos guardados); el contenido entra con fundido de 150 ms. Detalle en §6c | Igual | Sin spinner a pantalla completa |

**Implementación:**
- **Móvil:** mantener las animaciones nativas de `native-stack` (ya configuradas). Agregar `animation: 'fade'` a las pestañas (`bottom-tabs` v7). Para hojas, gestos y microinteracciones se recomienda **`react-native-reanimated`** (incluido en Expo) en lugar de `Animated`, porque corre en el hilo de UI y es interrumpible.
- **Web:** transiciones CSS con tokens. Para cambios de ruta, la *View Transitions API* cuando el navegador la soporte; si no, fundido simple. No hace falta una librería de animación.

## 4. Hojas inferiores y modales

| Momento | Movimiento |
|---|---|
| Abrir | El fondo pasa de 0 a 50 % en 250 ms; la hoja sube con resorte (≈ 350 ms) |
| Arrastrar | La hoja sigue el dedo en tiempo real; umbral de 8 px antes de empezar a arrastrar |
| Soltar | Si bajó más del 30 % o con velocidad > 800 px/s, se cierra; si no, vuelve con resorte |
| Cerrar | Baja con `--motion-ease-in` en 220 ms; el fondo se desvanece |
| Con cambios sin guardar | Al intentar cerrar, la hoja rebota hasta su lugar y aparece «¿Descartar los cambios?» |
| Teclado | La hoja sube con el teclado; el campo con foco queda visible |
| Modal web | Escala 0,96 → 1 + fundido (250 ms), cierre en 150 ms; `Esc` cierra; el foco queda atrapado dentro y vuelve al disparador al cerrar |

## 5. Botones y controles

| Componente | Reposo → presionado → suelto | Duración |
|---|---|---|
| **Botón** (con canto) | Baja 3 px (`translateY`) y el canto pasa a 0. Al soltar vuelve. Sin cambio de tamaño | 100 ms abajo / 150 ms arriba |
| **Botón** (hover web) | Brillo +7 % | 150 ms |
| **Botón cargando** | El texto cambia a gerundio con fundido; aparece el spinner; el ancho no cambia | 150 ms |
| **Tarjeta tocable / fila** | Escala 0,98 + fondo de tinte | 100 ms |
| **Botón de ícono** | Fondo `surface-muted` al presionar | 100 ms |
| **Chip de opción** | Al marcar: borde y tinte de marca + rebote 0,95 → 1,04 → 1 | 250 ms `--motion-ease-spring` |
| **Segmentado** | El indicador blanco se desliza a la opción elegida | 250 ms `--motion-ease-standard` |
| **Interruptor** | La perilla se desliza; el fondo pasa a verde | 150 ms |
| **Casilla** | El ✓ se dibuja (trazo) + fondo azul | 150 ms |
| **Tarjeta de opción** | El punto del radio crece desde el centro + borde azul | 150 ms |
| **Campo** | Al enfocar: el borde pasa a azul + halo de 3 px | 150 ms |
| **Campo con error** | El mensaje entra con fundido + 4 px desde arriba. **Sin sacudida** (molesta y no es accesible) | 150 ms |
| **Pestaña de la barra inferior** | La pastilla de tinte aparece detrás del ícono con escala 0,8 → 1 | 250 ms |
| **Lista que se actualiza** | El elemento nuevo entra resaltado (borde azul 1,2 s); el eliminado se colapsa con fundido | 250 ms |
| **Deslizar para acción** (si se usa) | Revela la acción con ícono y texto; la acción crítica siempre tiene además un botón visible | Sigue el dedo |

**Áreas táctiles:** mínimo 44 × 44 px, aunque el elemento visual sea menor (botón de ícono de 38 px con `hitSlop`).

## 6. Feedback que habla con el usuario

| Situación | Respuesta visual | Texto | Háptica (móvil)* |
|---|---|---|---|
| Acción guardada | Toast desde arriba (250 ms), visible 3–5 s, sale en 150 ms | «Cita guardada» | Ligera (`impactLight`) |
| Acción con deshacer | Toast con «Deshacer» durante 5 s | «Documento quitado de la mochila» | — |
| Toma registrada | La fila cambia «Tomar» → «✓ Tomado» (fundido cruzado) + el anillo de la meta avanza | Toast «Toma registrada a las 1:05 p. m.» | Éxito (`notificationSuccess`) |
| Check-in guardado | La hoja baja → la llama escala 1 → 1,6 → 1 (600 ms) → el número sube con rebote → el punto del día se llena | Toast «¡13 días seguidos cuidándote!» | Éxito |
| Paso de misión completado | El nodo late (escala 1,2), el riel se dibuja hasta el siguiente (700 ms) y el siguiente nodo se desbloquea con rebote | Toast «¡Paso completado! Sigue: …» | Éxito |
| Misión completada | Pantalla de celebración: **la mascota celebra** (3 saltos, brazos arriba, destellos; ver §6b), estadísticas escalonadas, insignia que gira, confeti de una vez (≤ 1,2 s) | «¡Lo lograste, {nombre}!» | Éxito |
| Subir de nivel | Toast con estrella + la barra se llena y reinicia | «¡Subiste al Nivel 5 · Constante!» | Éxito |
| Subida de archivo | Barra de progreso continua → mensaje «La IA está leyendo…» con destello pulsante → resultado | — | — |
| Error de validación | Mensaje bajo el campo + foco al resumen o al primer error | Causa + cómo corregir | Advertencia (`notificationWarning`) |
| Error de red | Banner en la pantalla con «Reintentar»; lo escrito se conserva | «No pudimos guardar. Revisa tu conexión.» | Error |
| Acción bloqueada (paso aún no disponible) | El nodo **no** se sacude; se muestra un toast explicativo | «Primero completa: Pedir la cita» | — |
| Carga larga (> 1 s) | Esqueleto; a los 10 s, texto «Esto está tardando más de lo normal» + «Reintentar» (§6c) | — | — |
| Cambio de contexto (cuidador) | El banner de color entra desde arriba; el lector de pantalla anuncia | «Ahora gestionas a Juan Pérez» | Ligera |

\* **Háptica:** requiere `expo-haptics` (no está instalado). Usarla solo en confirmaciones y errores, nunca en cada toque, y respetar la vibración del sistema.

## 6b. Mascota: celebración al completar una misión

Cuando el servidor confirma que la misión está completa, la mascota (pose «Celebra») **siempre** hace su animación de celebración. Es el único momento en que la mascota se mueve con énfasis.

| Capa | Movimiento | Tiempo |
|---|---|---|
| Cuerpo | 3 saltos de 22 px con estiramiento y aplastamiento (squash & stretch: 1,06 × 0,94 al tocar el suelo, 0,97 × 1,04 en el aire). Pivote en los pies (60, 130) | 3 × 400 ms · `cubic-bezier(.3,.8,.4,1)` |
| Brazos | Arriba, alternando ±16° (como aplaudiendo). Pivote en los hombros | 6 × 200 ms, ida y vuelta |
| Sombra | Se encoge al 62 % y se aclara en cada salto | Sincronizada con el cuerpo |
| Destellos | 5 estrellas de colores alrededor que aparecen, giran 90° y se desvanecen, escalonadas 70 ms | 700 ms, una vez |
| Inicio | 250 ms después de que aparece la tarjeta de celebración | — |
| Final | Queda quieta en pose «Celebra» (brazos arriba, ojos felices). **Sin bucle** | Total ≈ 1,2 s |

- **Movimiento reducido:** la mascota aparece directamente en pose «Celebra», sin saltos ni destellos.
- **«Celebraciones» apagado:** no hay pantalla de celebración; solo un toast «Misión completada · 8 de 8 pasos».
- **Implementación:** en móvil, `Mascot` con `pose="joy"` y `animate="celebrate"` (Reanimated: `withRepeat(withSequence(...), 3)` para el salto y `withRepeat(withTiming(16°), 6, true)` para los brazos). En web, keyframes CSS sobre los grupos del SVG (`.mb`, `.al`, `.ar`, `.msh`, `.spk`) con `transform-box: view-box`.
- La animación no bloquea: «Iniciar una misión nueva» y cerrar responden desde el primer momento.

## 6c. Estados de carga

Demo interactiva: sección «Estados de carga» de [`../movimiento.html`](../movimiento.html#carga). Las reglas salen del umbral de Doherty (la respuesta se ve antes de 400 ms) y de la checklist de UX (ítems 31, 33–35 y 94–96).

**Reglas**

1. **La respuesta se ve en menos de 400 ms.** Cada toque cambia algo enseguida, aunque sea el botón que baja.
2. **Esqueleto, no spinner.** Bloques grises con la forma del contenido; nunca un spinner a pantalla completa.
3. **Nada se mueve al llegar.** El esqueleto, las imágenes y los mensajes tienen el espacio reservado desde el principio.
4. **Lo lento empieza antes.** La página siguiente de una lista se pide cuando faltan 3 filas para el final; un archivo empieza a subir mientras la persona completa el formulario.
5. **Las esperas largas se explican.** Barra determinada y texto concreto («Subiendo 2 de 3»), no un spinner.
6. **Se prueba en un teléfono de gama media**, con red lenta (3G) y con movimiento reducido.

**Cuánto tarda → qué se muestra**

| Espera | Qué se ve | Ejemplo |
|---|---|---|
| 0–100 ms | Solo la respuesta al toque: el botón baja, el chip se marca | Tocar «Tomar» |
| Hay datos guardados | Lo guardado aparece al instante y se actualiza en segundo plano, **sin esqueleto** (TanStack Query: datos en caché + `refetch`). Si llega algo nuevo, entra arriba resaltado | Volver a Inicio |
| Sin datos, < 10 s | Esqueleto inmediato con la forma de la pantalla. Una vez visible dura **al menos 300 ms** para no parpadear. Después, el contenido entra con fundido de 150 ms | Abrir Documentos por primera vez |
| Acción que espera al servidor | Botón en carga (§5): gerundio + spinner pequeño dentro del botón, mismo ancho, deshabilitado | «Guardando…» |
| Duración conocida | Barra de progreso determinada + qué está pasando | «Subiendo 2 de 3» |
| > 10 s | El esqueleto se queda y aparece «Esto está tardando más de lo normal» + «Reintentar». Lo que la persona hizo se conserva | Red lenta |
| Error | Mensaje en el lugar del contenido, con la causa y «Reintentar»; nunca una pantalla en blanco | Sin conexión |

**Anatomía del esqueleto**

| Regla | Valor |
|---|---|
| Forma | Mismo tamaño, radio y posición que el contenido real |
| Qué **no** es esqueleto | Lo fijo de la pantalla se ve real desde el primer momento: título, pestañas, buscador, filtros, barra inferior y botón de volver. También la mascota y los íconos sueltos, que son locales. Solo el contenido que viene del servidor es esqueleto. Las tarjetas se quedan (son la forma), sin color de acento |
| Botones dentro de filas | También tienen su bloque («Tomar», «Hacer»), para que no aparezcan empujando el texto |
| Color | `--color-border`, con un brillo más claro en `--color-surface-muted` (se ve tanto sobre tarjetas blancas como sobre el fondo) |
| Brillo | Uno solo para toda la pantalla (no uno por bloque): 1,4 s, lineal, en bucle |
| Líneas de texto | Alto de la letra, ancho variado (≈ 70 % y 45 %) |
| Cuántas filas | Las que entran en pantalla (3–6), nunca más |
| Movimiento reducido | Sin brillo: bloques quietos |
| Accesibilidad | `aria-busy="true"` en el contenedor y un texto oculto («Cargando documentos»); en móvil, `accessibilityLabel` en el contenedor |

**Esqueletos de las pantallas principales** (mockups v2, módulo «11 · Estados de carga»: `../../design-v2/mockups/index.html?m=carga`. Cada esqueleto se genera desde su pantalla real con `skel()`)

| Pantalla | Real desde el inicio | Esqueleto |
|---|---|---|
| Inicio | Encabezado, mascota y barra inferior | Saludo, medicamentos de hoy con el bloque de su botón, próxima cita y racha |
| Agenda · Calendario | Título, pestañas y mes | 7 bloques de la semana, título del día y 3 filas con el borde de color en gris |
| Documentos | Título, buscador y filtros | Lista por grupos: etiqueta de fecha + 2 filas por grupo |
| Detalle de documento | Barra con volver y compartir | Vista previa con su proporción, título, fecha, chips y 3 pares etiqueta–valor |
| Mochilas | Título, buscador y barra inferior | Tarjetas con ícono, nombre, descripción y chips |
| Detalle de cita | Barra con volver y compartir | Encabezado de la cita, datos y acciones |
| Detalle de mochila | Barra con volver | Encabezado, «Compartir mochila» y la lista de documentos |
| Detalle de misión | Barra con volver | Encabezado (tipo, objetivo, barra) y 4 pasos con su nodo |

**Cómo entra el contenido**

| Qué | Cómo entra |
|---|---|
| Pantalla o tarjeta | Fundido cruzado esqueleto → contenido, 150 ms; sin deslizar más de 4 px |
| Listas | Por grupos («Hoy», «Mañana»), 40 ms entre grupos (`--motion-stagger`), máximo 6; el resto, de una vez |
| Página siguiente de una lista | Al final aparecen 2 filas de esqueleto; las filas nuevas entran con fundido |
| Imágenes | Espacio reservado desde el principio (proporción fija); la imagen aparece con fundido de 250 ms cuando terminó de cargar |
| Anillos y barras de progreso | Crecen desde 0 solo la primera vez que se abre la pantalla (600 ms). Al actualizar, cambian sin animar |
| Números | Se muestran directo. Solo cuentan hacia arriba cuando cambian por algo que hizo la persona (la racha) |
| Datos nuevos al refrescar | Lo que ya estaba no se mueve; lo nuevo entra arriba con un resaltado de borde de 1,2 s |
| Nunca | Texto letra por letra, rebotes al cargar, spinner a pantalla completa, contenido que empuja lo que la persona está leyendo |

## 7. Motivación: cuánto y cuándo

| Nivel | Cuándo | Qué se mueve |
|---|---|---|
| **Discreto** (siempre) | Toma, check-in, guardar | Cambio de estado + toast |
| **Medio** | Racha +1, paso de misión, subir de nivel | Un elemento hace una animación de énfasis (llama, nodo o barra), una sola vez |
| **Alto** | Misión completada | Pantalla de celebración con confeti |

- Nunca dos celebraciones seguidas: si se completa el paso final, solo se muestra la celebración de la misión.
- Ningún movimiento motivacional sobre datos clínicos ni en confirmaciones de borrado.
- Con «Celebraciones: apagado» en Configuración: solo el cambio de estado y el toast.

## 8. Movimiento reducido y rendimiento

- Con `prefers-reduced-motion` (web) o `AccessibilityInfo.isReduceMotionEnabled()` (móvil):
  - las transiciones de pantalla pasan a fundido de 150 ms
  - sin rebotes, sin confeti, sin halo pulsante ni llama animada
  - las barras y anillos cambian sin animar
- Solo se animan `transform` y `opacity`. Nada de `width`, `height`, `top` ni `left` (evita saltos de layout).
- Todas las animaciones son **interrumpibles**: un nuevo toque cancela la anterior y fija el estado final explícitamente.
- La UI nunca se bloquea esperando a que termine una animación. El estado se actualiza al confirmar el servidor, no al terminar la animación.
- Bucles permitidos: solo el halo del paso actual (1,8 s), el destello de «IA leyendo» y el brillo del esqueleto (1,4 s), y se detienen fuera de pantalla.

## 9. Checklist

- [ ] Cada animación responde a «¿me escuchó?», «¿dónde estoy?», «¿qué cambió?» o «¿funcionó?»
- [ ] Entrar con `ease-out`, salir con `ease-in` y salir más rápido que entrar
- [ ] Máximo 1 o 2 elementos animados a la vez
- [ ] Gestos del sistema intactos (volver con el borde, pellizcar en documentos)
- [ ] Probado con movimiento reducido y con «Celebraciones» apagado
- [ ] Toasts sin robar el foco y anunciados (`aria-live="polite"`)
- [ ] Foco atrapado en modales y devuelto al disparador al cerrar
- [ ] Carga con esqueleto de la forma del contenido; sin esqueleto si hay datos guardados; nada se mueve cuando llega el contenido (§6c)
- [ ] Esperas de duración conocida con barra y texto concreto; a los 10 s, mensaje + «Reintentar»
