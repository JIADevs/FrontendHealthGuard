# Checklist UX · índice para auditar la web

Fuente: [The UX checklist · Broch Builds](https://brochbuilds.com/ux). El texto completo de cada ítem está allí. Este índice usa **la misma numeración (1–132)**, que es la que citan el [`CHANGELOG`](../CHANGELOG.md) y la auditoría móvil del 2026-11-18. Las etiquetas son resúmenes propios; ante cualquier duda, manda la fuente.

**Columna «Web»** (cómo aplica en escritorio, 1024–1440 px):

- ✓ aplica igual que en móvil.
- ≈ aplica con una adaptación (ver nota).
- — no aplica a la app web de escritorio. Sigue aplicando a la **vista pública** (`share/doc`), que se abre sobre todo en el teléfono.
- Manual: no se puede juzgar desde un mockup ni desde el código; se prueba con personas o con herramientas.

Resumen: 116 ✓ · 7 ≈ · 7 — · 2 manuales.

---

## Parte 1 · Leyes

### Hick (1–10)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 1 | Una acción principal por pantalla | ✓ | Incluye el encabezado de la página, que en web suele acumular botones |
| 2 | La acción principal se ve como la más importante | ✓ | |
| 3 | Opciones avanzadas ocultas hasta que hagan falta | ✓ | |
| 4 | Nunca dos botones con el mismo peso | ✓ | |
| 5 | No mostrar opciones que todavía no aplican | ✓ | |
| 6 | Opción más común preseleccionada | ✓ | |
| 7 | Destacar un plan de precios | — | Hoy no hay precios en web; aplica cuando exista «Mi plan» |
| 8 | Dividir los formularios largos | ≈ | En escritorio, por secciones o pasos; no hace falta una pregunta por pantalla |
| 9 | Cinco ítems o menos en el menú principal | ✓ | |
| 10 | Agrupar configuraciones parecidas | ✓ | |

### Fitts (11–15)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 11 | Botón principal grande | ≈ | En escritorio alcanza el tamaño `md` del sistema (48 px); no hace falta agrandarlo más |
| 12 | Botón principal abajo, donde está el pulgar | ≈ | En escritorio: en un lugar predecible (pie del modal a la derecha, final del formulario) |
| 13 | Toda la fila es clicable | ✓ | |
| 14 | Eliminar lejos de guardar | ✓ | |
| 15 | Lo más usado, más grande y más a mano | ✓ | |

### Jakob (16–20)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 16 | Logo arriba a la izquierda y lleva al inicio | ✓ | |
| 17 | Perfil (y carrito) arriba a la derecha | ✓ | |
| 18 | Íconos conocidos | ✓ | |
| 19 | Palabras esperadas («Iniciar sesión») | ✓ | |
| 20 | Creatividad solo en lo propio de la app | ✓ | |

### Von Restorff (21–25)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 21 | Un solo elemento distinto por pantalla | ✓ | |
| 22 | Distinto en una sola cosa (color o tamaño) | ✓ | |
| 23 | Todo lo demás, sobrio | ✓ | |
| 24 | Ese elemento es la acción más importante | ✓ | |
| 25 | Destacar menos | ✓ | |

### Gradiente de meta (26–30)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 26 | Pasos restantes visibles desde el primero | ✓ | |
| 27 | La barra de progreso no arranca vacía | ✓ | |
| 28 | El último paso es el más fácil | ✓ | |
| 29 | Progreso junto al botón | ✓ | |
| 30 | Mostrar la siguiente meta al terminar | ✓ | |

### Doherty (31–35)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 31 | Respuesta inmediata a cada clic | ✓ | |
| 32 | Cambio inmediato, guardado en segundo plano | ✓ | Con las excepciones de `pages/movimiento-interacciones.md` §1b |
| 33 | Empezar temprano lo que es lento | ✓ | |
| 34 | Esqueleto en vez de spinner | ✓ | |
| 35 | Barra de progreso en lo que es lento | ✓ | |

## Parte 2 · Más leyes y principios

| # | Ítem | Web | Nota |
|---|---|---|---|
| 36 | No obligar a recordar datos entre pantallas | ✓ | Miller |
| 37 | Comparaciones lado a lado cortas | ✓ | |
| 38 | «Siete» no es una regla de menús | ✓ | |
| 39 | Números largos agrupados | ✓ | Chunking |
| 40 | Textos largos en secciones con títulos | ✓ | |
| 41 | Listas largas en grupos con título | ✓ | |
| 42 | Quitar lo que no ayuda a la tarea | ✓ | Carga cognitiva |
| 43 | Elegir en vez de recordar | ✓ | |
| 44 | Hacer las cuentas por la persona | ✓ | |
| 45 | Lo importante al principio y al final | ✓ | Posición serial |
| 46 | No enterrar acciones clave en el medio | ✓ | |
| 47 | Abrir y cerrar con lo que debe quedar | ✓ | |
| 48 | Mostrar lo que falta por hacer | ✓ | Zeigarnik |
| 49 | Guardar el avance automáticamente | ✓ | |
| 50 | Retomar donde se dejó | ✓ | |
| 51 | Cuidar el mejor momento | ✓ | Pico-final |
| 52 | Cerrar cada flujo con un éxito claro | ✓ | |
| 53 | Cuidar los peores momentos (errores, cancelar) | ✓ | |
| 54 | Que la app cargue con la complejidad | ✓ | Tesler |
| 55 | No simplificar quitando lo necesario | ✓ | |
| 56 | Precargar lo que ya se sabe | ✓ | |
| 57 | Aceptar entradas en cualquier formato razonable | ✓ | Postel |
| 58 | Limpiar la entrada en vez de rechazarla | ✓ | |
| 59 | Un solo formato de fecha y de moneda | ✓ | |
| 60 | Pulir las pantallas que se ven primero | ✓ | Estética-usabilidad |
| 61 | Espaciado, color y tipografía coherentes | ✓ | |
| 62 | Observar lo que hace quien prueba | Manual | Prueba con personas |
| 63 | Etiqueta pegada a su campo | ✓ | Proximidad |
| 64 | Más espacio entre grupos que dentro de ellos | ✓ | |
| 65 | Botón junto a lo que afecta | ✓ | |
| 66 | Todo lo clicable con el mismo estilo | ✓ | Similaridad |
| 67 | Texto que no parece enlace ni botón | ✓ | |
| 68 | Un color, un significado | ✓ | |
| 69 | Tarjetas o paneles para agrupar | ✓ | Región común |
| 70 | No encerrar juntas cosas sin relación | ✓ | |
| 71 | Las acciones de una sección, dentro de su caja | ✓ | |

## Parte 3 · Checklists por tipo de pantalla

### Onboarding (72–76)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 72 | Probar antes de registrarse | — | Vive en la landing (otro repo) |
| 73 | Pedir solo lo necesario para empezar | ✓ | |
| 74 | Llegar rápido a un primer resultado útil | ✓ | |
| 75 | Enseñar haciendo, no con un tutorial | ✓ | |
| 76 | Permitir saltar pasos opcionales | ✓ | |

### Formularios (77–81)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 77 | Una columna | ✓ | En escritorio es tentador usar dos: no hacerlo |
| 78 | Etiquetas visibles arriba, no solo placeholder | ✓ | |
| 79 | Teclado correcto para cada campo | ≈ | Solo en la web abierta desde el teléfono (vista pública, acceso) |
| 80 | Autocompletado y gestores de contraseñas | ✓ | |
| 81 | Validar al salir del campo | ✓ | |

### Botones (82–86)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 82 | El botón dice qué pasa | ✓ | |
| 83 | Empieza con un verbo | ✓ | |
| 84 | Evitar el doble envío | ✓ | |
| 85 | Botones que parecen botones y enlaces que parecen enlaces | ✓ | |
| 86 | Confirmar solo lo irreversible | ✓ | |

### Navegación (87–91)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 87 | Mostrar dónde está la persona | ✓ | |
| 88 | Navegación siempre en el mismo lugar | ✓ | |
| 89 | «Atrás» siempre funciona sin perder trabajo | ✓ | En web: el botón atrás del navegador con modales abiertos (ver W2) |
| 90 | Búsqueda fácil de encontrar | ✓ | |
| 91 | Etiquetas claras, no ingeniosas | ✓ | |

### Feedback, carga y velocidad (92–96)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 92 | Confirmar cada acción | ✓ | |
| 93 | Deshacer lo que se puede lamentar | ✓ | |
| 94 | Sin saltos de layout al cargar | ✓ | |
| 95 | Explicar las esperas largas | ✓ | |
| 96 | Probar en un equipo modesto con conexión lenta | Manual | En web: con la red limitada de las herramientas del navegador |

### Estados vacíos (97–101)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 97 | Nunca una pantalla en blanco | ✓ | |
| 98 | Una acción clara para llenarla | ✓ | |
| 99 | Ejemplo o plantilla | ✓ | |
| 100 | «Sin resultados» que ayude | ✓ | |
| 101 | «Todo al día» como buena noticia | ✓ | |

### Errores (102–106)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 102 | Qué pasó, en palabras simples | ✓ | |
| 103 | Cómo arreglarlo | ✓ | |
| 104 | Error junto al campo | ✓ | |
| 105 | No borrar lo escrito | ✓ | |
| 106 | Prevenir errores antes de que pasen | ✓ | |

### Móvil y alcance del pulgar (107–111)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 107 | Acciones principales al alcance del pulgar | — | Salvo la vista pública en el teléfono |
| 108 | Separación entre controles | ✓ | Mínimo 8 px, como en MASTER §6 |
| 109 | No depender del hover | ✓ | En web importa más: lo que solo aparece con el mouse no existe en tablet ni con teclado (ver W5) |
| 110 | No esconder acciones solo detrás de gestos | ≈ | En web, el equivalente es esconderlas solo detrás del hover |
| 111 | Probar con una mano en un teléfono real | — | Salvo la vista pública |

### Accesibilidad (112–117)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 112 | Contraste de texto ≥ 4,5:1 (3:1 en texto grande) | ✓ | |
| 113 | Objetivos de 44 × 44 o más | ✓ | **Decidido (v2.8):** 44 px también en web, aunque se use con mouse; no se usa el mínimo de 24 px de WCAG 2.2 AA (2.5.8). Motivos en el CHANGELOG, sección 12 |
| 114 | Foco visible | ✓ | |
| 115 | Texto alternativo en imágenes con significado | ✓ | |
| 116 | Respetar el movimiento reducido | ✓ | |
| 117 | Nunca solo color para dar significado | ✓ | |

### Tipografía (118–122)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 118 | Cuerpo de 16 px o más en móvil | ≈ | En escritorio aplica MASTER §5 (15 px); la decisión 15 vs 16 sigue abierta en el CHANGELOG |
| 119 | Líneas de 50–75 caracteres | ✓ | Clave en pantallas anchas (ver W4) |
| 120 | Interlineado cercano a 1,5 | ✓ | |
| 121 | Jerarquía clara de títulos | ✓ | |
| 122 | Cuerpo alineado a la izquierda | ✓ | |

### Copy (123–127)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 123 | Escribir como se habla | ✓ | |
| 124 | Decir qué gana la persona | ✓ | |
| 125 | Una palabra para cada cosa | ✓ | Glosario de MASTER §11 |
| 126 | Quitar las palabras que no ayudan | ✓ | |
| 127 | Ser específico | ✓ | |

### Confianza y precios (128–132)

| # | Ítem | Web | Nota |
|---|---|---|---|
| 128 | Precio real desde el principio | — | Hoy no hay precios en web |
| 129 | Qué pasa al terminar la prueba | — | Ídem |
| 130 | Cancelar tan fácil como suscribirse | ≈ | Hoy aplica a eliminar la cuenta, como en móvil |
| 131 | Solo pruebas sociales reales | — | Vive en la landing |
| 132 | Contacto y reembolso fáciles de encontrar | ✓ | «Ayuda y contacto» |

---

## Ítems propios de escritorio (W1–W7)

No están en la fuente. Se agregan con su propia numeración para no alterar la de 1–132.

| # | Ítem | Amplía |
|---|---|---|
| W1 | Teclado: orden de Tab lógico, Esc cierra el modal, el foco queda dentro del modal y vuelve al elemento que lo abrió | 114 |
| W2 | Cada detalle o formulario importante tiene su URL: se puede recargar, compartir y volver atrás sin perder trabajo | 89 |
| W3 | Sin desbordes ni columnas aplastadas a 1440, 1280 y 1024 px | 61, 94 |
| W4 | Ancho máximo del contenido y del texto en pantallas anchas | 119 |
| W5 | El hover es una mejora: todo lo que aparece al pasar el mouse también se alcanza con teclado y táctil | 109, 110 |
| W6 | Densidad: criterio de cuándo usar tabla y cuándo tarjetas en listas largas | 41, 69 |
| W7 | Subida de archivos con arrastrar y soltar y un área visible | 43, 106 |

## Formato de los hallazgos

Una sola tabla, ordenada por prioridad:

| Prioridad | Pantalla | Ítem | Qué falla | Evidencia | Arreglo |
|---|---|---|---|---|---|

- **Alta:** frena o bloquea la acción principal de una pantalla clave (acceso, Inicio, Agenda, Documentos) o deja afuera a alguien (accesibilidad).
- **Media:** agrega fricción en otro lugar.
- **Baja:** pulido.
- **Evidencia:** el mockup (`m2-agenda.js` · nombre de la pantalla) o el código (`archivo:línea`). Lo que no se puede juzgar así va como **Manual**, con cómo comprobarlo.
- No se marca nada como cumplido sin evidencia; si no se puede saber, va como **Dudoso** con el motivo.
