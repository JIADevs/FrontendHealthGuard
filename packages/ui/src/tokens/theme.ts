import { colors, palette } from "./tokens";
import { semanticLight, semanticDark, type SemanticTokens } from "./semantic";

/**
 * Temas claro y oscuro (v2). Los valores salen de `semantic.ts`, que es copia de
 * `.docs/design/system/tokens.css`. Se conservan todas las claves de la v1 (las usan
 * pantallas y componentes) y se agregan las de la v2 al lado.
 */

type Sidebar = { bgSidebar: string; bgSidebarHover: string };
type BrandExtras = { tintMed: string; tintStrong: string; onSolid: string; fg: string; solidAlt: string };
type BorderExtras = { light: string; medium: string };

function buildTheme(s: SemanticTokens, sidebar: Sidebar, brand: BrandExtras, border: BorderExtras) {
  return {
    surface: {
      bg:             s["bg"],
      bgCard:         s["surface"],
      bgSidebar:      sidebar.bgSidebar,
      bgSidebarHover: sidebar.bgSidebarHover,
      /** v2: chips grises, segmentado, campos */
      muted:          s["surface-muted"],
    },
    text: {
      primary:   s["text-primary"],
      secondary: s["text-secondary"],
      muted:     s["text-muted"],
      /** v2: texto sobre `surface.muted`, el segmentado y tintes de marca (≥ 4,5:1) */
      onMuted:   s["text-on-muted"],
      /** v2: texto sobre rellenos sólidos */
      onSolid:   s["text-on-solid"],
    },
    border: {
      default: s["border"],
      light:   border.light,
      medium:  border.medium,
    },
    brand: {
      /** Relleno de botón primario, FAB, navegación activa (blanco encima ≥ 4,5:1) */
      solid:      s["brand-solid"],
      /** Hover / presionado del relleno */
      solidAlt:   brand.solidAlt,
      /** v2: canto inferior de 3 px del botón primario */
      edge:       s["brand-edge"],
      /** Fondo de tinte — chips, contenedores de ícono, ítem activo */
      tint:       s["brand-tint"],
      /** Tinte medio — fondo de ítem activo, filas resaltadas */
      tintMed:    brand.tintMed,
      /** Borde sobre tinte */
      tintBorder: s["brand-tint-border"],
      /** Texto sobre tinte y enlaces */
      tintText:   s["brand-text"],
      /** v2: alias de `tintText` con el nombre de la v2 */
      text:       s["brand-text"],
      /** Título dentro de áreas de marca */
      tintStrong: brand.tintStrong,
      /** Subtítulo sobre relleno de marca */
      onSolid:    brand.onSolid,
      /** Íconos y elementos activos */
      fg:         brand.fg,
      /** v2: borde y anillo de foco */
      focus:      s["brand-focus"],
    },
    status: {
      errorBg:      s["danger-bg"],
      errorFg:      s["danger-fg"],
      errorBorder:  s["danger-solid"],
      successBg:    s["success-bg"],
      successFg:    s["success-fg"],
      warningBg:    s["warning-bg"],
      warningFg:    s["warning-fg"],
      /** v2 */
      infoBg:         s["info-bg"],
      infoFg:         s["info-fg"],
      successSolid:   s["success-solid"],
      successEdge:    s["success-edge"],
      successGraphic: s["success-graphic"],
      dangerSolid:    s["danger-solid"],
      dangerEdge:     s["danger-edge"],
      dangerBorder:   s["danger-border"],
    },
    accent: {
      docBg:       s["feature-document-bg"],
      docFg:       s["feature-document-fg"],
      calBg:       s["feature-appointment-bg"],
      calFg:       s["feature-appointment-fg"],
      medBg:       s["feature-medication-bg"],
      medFg:       s["feature-medication-fg"],
      aiBg:        s["feature-ai-bg"],
      aiFg:        s["feature-ai-fg"],
      notifBg:     s["feature-notification-bg"],
      notifFg:     s["feature-notification-fg"],
      backpackBg:  s["feature-backpack-bg"],
      backpackFg:  s["feature-backpack-fg"],
      /** v2: bienestar y check-ins (antes usaban `notif*`) */
      wellbeingBg: s["feature-wellbeing-bg"],
      wellbeingFg: s["feature-wellbeing-fg"],
      missionBg:   s["feature-mission-bg"],
      missionFg:   s["feature-mission-fg"],
      treatmentBg: s["feature-treatment-bg"],
      treatmentFg: s["feature-treatment-fg"],
    },
    /** v2 (MASTER §4.4): racha, nivel e insignias, progreso */
    motivation: {
      streak:       s["motivation-streak"],
      streakLight:  s["motivation-streak-light"],
      streakBg:     s["motivation-streak-bg"],
      streakBorder: s["motivation-streak-border"],
      streakText:   s["motivation-streak-text"],
      streakSolid:  s["motivation-streak-solid"],
      streakEdge:   s["motivation-streak-edge"],
      level:        s["motivation-level"],
      levelEdge:    s["motivation-level-edge"],
      progress:     s["motivation-progress"],
      track:        s["motivation-track"],
    },
  };
}

// ─── Tema Light ───────────────────────────────────────────────────────────────

export const lightTheme = buildTheme(
  semanticLight,
  { bgSidebar: colors.slate[900], bgSidebarHover: colors.slate[800] },
  {
    solidAlt:   semanticLight["brand-text"],
    tintMed:    palette.brand[100],
    tintStrong: palette.brand[900],
    onSolid:    palette.brand[100],
    fg:         semanticLight["brand-solid"],
  },
  { light: colors.slate[100], medium: colors.slate[200] },
);

// ─── Tema Dark ────────────────────────────────────────────────────────────────

export const darkTheme = buildTheme(
  semanticDark,
  { bgSidebar: colors.slate[950], bgSidebarHover: colors.slate[700] },
  {
    solidAlt:   semanticDark["brand-edge"],
    tintMed:    "rgba(59, 130, 246, 0.18)",
    tintStrong: palette.brand[200],
    onSolid:    palette.brand[200],
    fg:         semanticDark["brand-focus"],
  },
  { light: "rgba(148, 163, 184, 0.1)", medium: colors.slate[700] },
);

export type LightTheme = typeof lightTheme;
export type DarkTheme = typeof darkTheme;

/** Union semántica: las claves de la v1 más las de la v2. */
export type AppTheme = ReturnType<typeof buildTheme>;

export type ThemeMode = "light" | "dark";
