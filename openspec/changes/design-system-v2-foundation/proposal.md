# Proposal: Design system v2 — base (tokens y fuentes)

## Intent

El diseño v2 está aprobado (`.docs/design/`, ADR 0002 aceptado), pero el código sigue con los tokens de la v1:
- el botón principal no pasa contraste AA;
- documentos y mochilas usan los colores reservados para «completado» y para la racha;
- no se carga ninguna fuente.

Este change es la **primera parte de la Fase 0** del issue #35. Lleva los tokens, el tema y las fuentes de la v2 a `@helu/ui` y a las dos apps, para que todas las pantallas cambien de color y contraste de una vez sin tocar su estructura.

**Plataformas:** `packages/ui` (compartido), `apps/mobile` y `apps/web`. Web entra explícitamente porque consume los mismos tokens (`cssVariables.ts`) y necesita cargar las fuentes. **Backend: sin cambios.**

## Scope

### In Scope
- **Tokens (`tokens.ts`):**
  - escala `teal` y tonos faltantes (`green[800]`, `orange[800]`, `error[700]` y los 300/400 del modo oscuro);
  - `palette.accent` reasignada: `document` → sky, `backpack` → teal, `notification` → marca; nuevos `wellbeing`, `mission` y `treatment`;
  - `palette.motivation` (racha, nivel, progreso);
  - radios de la v2 (input 14, tarjeta 18, modal 24, hoja 28) sin cambiar los existentes;
  - `fontFamily.heading` y `fontFamily.body`, `fontWeight.black` y el mapa de familias nativas por peso.
- **Tema (`theme.ts`):** valores claro y oscuro iguales a `.docs/design/system/tokens.css`. Se mantienen todas las claves actuales de `AppTheme` y se agregan las nuevas: `brand.edge`, `brand.focus`, `text.onMuted`, `surface.muted`, estado `info` y sólidos de éxito y peligro, acentos nuevos y `motivation`.
- **Variables CSS (`cssVariables.ts`):** emitir las `--color-*`, `--font-heading`, `--font-body` y los radios de la v2, en claro y oscuro. Los nombres de la v1 (`--brand-*`, `--text-*`, `--accent-*`…) se mantienen como alias con los valores nuevos.
- **Usos directos de `palette.brand[500]`:**
  - rellenos → `brand.solid`;
  - textos y enlaces → `brand.text`;
  - íconos y spinners → `brand.solid`;
  - bordes de foco → `brand.focus`.
  - En el CSS de web: `background` y `color` con `--brand-500` pasan a `--color-brand-solid` y `--color-brand-text`.
- **Fuentes:** Nunito (700/800/900) e Inter (400/500/600).
  - Mobile: `expo-font` y `@expo-google-fonts`; la app espera a que carguen antes de mostrarse.
  - Web: `next/font/google`.
  - `Typography.native` mapea cada rol a la familia según el peso.
- **Limpieza:** los 6 colores hex escritos a mano en mobile y los 2 «tenés» que quedan.
- **Documentación:** la tabla del ADR 0002 y `.docs/architecture/design-system.md`.

### Out of Scope
- **Componentes nuevos o con API nueva:** IconButton, Toast con «Deshacer», BottomActionBar, variantes de Button… Van en la **segunda parte de la Fase 0** (otro change).
- **Usar Nunito en todas las pantallas.** En este PR solo la usa `Typography`; las pantallas la adoptan al migrar a los componentes nuevos.
- **Cambiar los radios actuales (`radii.md`, `radii.lg`).** Se agregan los nuevos; los componentes los adoptan en la segunda parte.
- **Migrar el CSS de web a las `--color-*`.** Solo se cambian los rellenos y textos con `--brand-500`; el resto, en la Fase 4.
- **Validar el modo oscuro pantalla por pantalla:** no hay mockups en oscuro. Se copian los valores de `tokens.css` y se revisa que nada quede ilegible.
- Cualquier cambio de backend.

## Approach

1. Tokens y tema primero, con los valores de `tokens.css` como fuente de verdad.
2. Variables CSS después, generadas desde el tema, para que web y mobile no diverjan.
3. Usos directos de `brand[500]`, clasificados según qué son (relleno, texto, ícono o foco).
4. Fuentes en las dos apps.
5. Limpieza y documentación.

Cada paso es un commit; el detalle está en `design.md` y `tasks.md`.

## Risks

| Riesgo | Mitigación |
|---|---|
| Todas las pantallas cambian de color a la vez | Es el objetivo. Se revisan las pantallas principales en web y mobile antes del PR |
| Romper consumidores de `AppTheme` | Solo se agregan claves; las existentes no se renombran ni se borran. `tsc` y el build de web lo verifican |
| La app se muestra antes de que carguen las fuentes (salto de texto) | `useFonts` se suma a la espera que ya existe (`isHydrated`) en `App.tsx` |
| Pesos de fuente mal mapeados en Android | Helper `nativeFont(rol, peso)`; nunca `fontFamily` + `fontWeight` sueltos con fuentes cargadas |
| Modo oscuro sin mockups | Valores tomados de `tokens.css`; revisión de que nada quede ilegible |

## Success Criteria
- Texto blanco sobre el botón principal ≥ 4,5:1 (5,17:1 con `#2563EB`), en web y mobile.
- Documentos en sky y mochilas en teal en las dos apps.
- Nunito e Inter cargadas: `Typography` las muestra en mobile y los títulos de web usan `--font-heading`.
- Ningún uso de `palette.brand[500]` como relleno o texto en `apps/` y `packages/ui`.
- Ningún error de tipos nuevo frente a `dev` en mobile ni en web. `dev` ya tiene errores previos, así que ni `tsc` ni `next build` pasan por completo.
