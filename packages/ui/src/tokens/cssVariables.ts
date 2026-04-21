import { colors, surface, border, radii, overlay, fontFamily } from "./tokens";
import { palette } from "./tokens";
import { lightTheme, darkTheme } from "./theme";

/**
 * Helper: convierte hex a RGB para usar en rgba() del dark mode.
 */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Genera el bloque CSS :root (light) + dark mode con todas las variables del sistema de diseño.
 * Dark mode se activa por:
 *   1. data-theme="dark" en el <html> (toggle manual)
 *   2. @media (prefers-color-scheme: dark) si data-theme="light" NO está definido
 *
 * IMPORTANTE: Las variables --brand-* se generan desde palette.brand (fuente de verdad única).
 * Cambiar palette.brand en tokens.ts actualiza automáticamente web y mobile.
 */
export function generateCssVariables(): string {
  const brandRgb = hexToRgb(palette.brand[500]);

  const darkBlock = `
    /* Surfaces (dark mode — rich navy) */
    --bg:               ${darkTheme.surface.bg};
    --bg-card:          ${darkTheme.surface.bgCard};
    --bg-sidebar:       ${darkTheme.surface.bgSidebar};
    --bg-sidebar-hover: ${darkTheme.surface.bgSidebarHover};

    /* Text (dark mode) */
    --text-primary:   ${darkTheme.text.primary};
    --text-secondary: ${darkTheme.text.secondary};

    /* Border (dark mode — subtle glow) */
    --border: ${darkTheme.border.default};
    --border-light: ${darkTheme.border.light};

    /* Brand solid (dark mode — deeper shade for headers) */
    --brand-header:     ${darkTheme.brand.solid};
    --brand-header-alt: ${darkTheme.brand.solidAlt};
    --brand-header-sub: ${darkTheme.brand.onSolid};

    /* Brand tints (semi-transparent on dark bg) */
    --brand-50:  ${darkTheme.brand.tint};
    --brand-100: ${darkTheme.brand.tintMed};
    --brand-200: ${darkTheme.brand.tintBorder};
    --brand-300: rgba(${brandRgb}, 0.35);

    /* Brand foreground (slightly brighter on dark) */
    --brand-400: ${palette.brand[300]};
    --brand-500: ${palette.brand[400]};
    --brand-600: ${palette.brand[500]};
    --brand-700: ${darkTheme.brand.tintText};
    --brand-800: ${palette.brand[700]};
    --brand-900: ${palette.brand[600]};

    /* Gray scale (dark overrides — inverted to slate) */
    --gray-50:  ${colors.slate[800]};
    --gray-100: ${colors.slate[700]};
    --gray-200: ${colors.slate[600]};
    --gray-300: ${colors.slate[500]};
    --gray-400: ${colors.slate[400]};
    --gray-500: ${colors.slate[300]};
    --gray-600: ${colors.slate[200]};
    --gray-700: ${colors.slate[100]};
    --gray-800: ${colors.slate[50]};
    --gray-900: ${colors.white};

    /* Status tints (semi-transparent on dark bg) */
    --error-50:    ${darkTheme.status.errorBg};
    --error-500:   ${darkTheme.status.errorFg};
    --error-600:   ${darkTheme.status.errorBorder};
    --error-800:   ${palette.status.error[400]};
    --success-50:  ${darkTheme.status.successBg};
    --success-500: ${darkTheme.status.successFg};
    --success-600: ${palette.status.success[500]};
    --warning-50:  ${darkTheme.status.warningBg};
    --warning-500: ${darkTheme.status.warningFg};
    --warning-600: ${palette.status.warning[600]};

    /* Accent tokens (semantic, dark mode) */
    --accent-doc-bg:   ${darkTheme.accent.docBg};
    --accent-doc-fg:   ${darkTheme.accent.docFg};
    --accent-cal-bg:   ${darkTheme.accent.calBg};
    --accent-cal-fg:   ${darkTheme.accent.calFg};
    --accent-med-bg:   ${darkTheme.accent.medBg};
    --accent-med-fg:   ${darkTheme.accent.medFg};
    --accent-ai-bg:    ${darkTheme.accent.aiBg};
    --accent-ai-fg:    ${darkTheme.accent.aiFg};
    --accent-notif-bg: ${darkTheme.accent.notifBg};
    --accent-notif-fg: ${darkTheme.accent.notifFg};

    /* Extended palette (dark overrides) */
    --amber-800:   ${colors.amber[500]};
    --green-700:   ${colors.green[500]};

    /* Focus rings (more visible on dark) */
    --brand-ring-sm: rgba(${brandRgb}, 0.25);
    --brand-ring-md: rgba(${brandRgb}, 0.30);

    /* Shadows more visible on dark */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.25);
  `;

  return `
:root {
  /* Brand (generated from palette.brand — single source of truth) */
  --brand-50:  ${palette.brand[50]};
  --brand-100: ${palette.brand[100]};
  --brand-200: ${palette.brand[200]};
  --brand-300: ${palette.brand[300]};
  --brand-400: ${palette.brand[400]};
  --brand-500: ${palette.brand[500]};
  --brand-600: ${palette.brand[600]};
  --brand-700: ${palette.brand[700]};
  --brand-800: ${palette.brand[800]};
  --brand-900: ${palette.brand[900]};

  /* Brand header (light mode defaults) */
  --brand-header:     ${lightTheme.brand.solid};
  --brand-header-alt: ${lightTheme.brand.solidAlt};
  --brand-header-sub: ${lightTheme.brand.onSolid};

  /* Gray */
  --gray-50:  ${colors.gray[50]};
  --gray-100: ${colors.gray[100]};
  --gray-200: ${colors.gray[200]};
  --gray-300: ${colors.gray[300]};
  --gray-400: ${colors.gray[400]};
  --gray-500: ${colors.gray[500]};
  --gray-600: ${colors.gray[600]};
  --gray-700: ${colors.gray[700]};
  --gray-800: ${colors.gray[800]};
  --gray-900: ${colors.gray[900]};

  /* Success */
  --success-50:  ${colors.success[50]};
  --success-500: ${colors.success[500]};
  --success-600: ${colors.success[600]};

  /* Warning */
  --warning-50:  ${colors.warning[50]};
  --warning-500: ${colors.warning[500]};
  --warning-600: ${colors.warning[600]};

  /* Error */
  --error-50:  ${colors.error[50]};
  --error-500: ${colors.error[500]};
  --error-600: ${colors.error[600]};
  --error-800: ${colors.error[800]};

  /* Extended palette */
  --amber-800:   ${colors.amber[800]};
  --green-700:   ${colors.green[700]};

  /* Accent tokens (semantic, light mode) */
  --accent-doc-bg:   ${lightTheme.accent.docBg};
  --accent-doc-fg:   ${lightTheme.accent.docFg};
  --accent-cal-bg:   ${lightTheme.accent.calBg};
  --accent-cal-fg:   ${lightTheme.accent.calFg};
  --accent-med-bg:   ${lightTheme.accent.medBg};
  --accent-med-fg:   ${lightTheme.accent.medFg};
  --accent-ai-bg:    ${lightTheme.accent.aiBg};
  --accent-ai-fg:    ${lightTheme.accent.aiFg};
  --accent-notif-bg: ${lightTheme.accent.notifBg};
  --accent-notif-fg: ${lightTheme.accent.notifFg};

  /* Surfaces (light mode) */
  --bg:               ${surface.bg};
  --bg-card:          ${surface.bgCard};
  --bg-sidebar:       ${surface.bgSidebar};
  --bg-sidebar-hover: ${surface.bgSidebarHover};

  /* Text (light mode) */
  --text-primary:   ${colors.gray[900]};
  --text-secondary: ${colors.gray[500]};
  --text-sidebar:   ${colors.slate[200]};

  /* Border (light mode) */
  --border: ${border.default};

  /* Overlays */
  --overlay-dark:   ${overlay.darker};
  --overlay-shadow: rgba(0, 0, 0, 0.25);

  /* Focus rings */
  --brand-ring-sm: rgba(${brandRgb}, 0.12);
  --brand-ring-md: rgba(${brandRgb}, 0.15);
  --success-ring:    rgba(22, 163, 74, 0.3);

  /* Radii */
  --radius:      ${radii.md}px;
  --radius-sm:   ${radii.sm}px;
  --radius-full: ${radii.full}px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05);

  /* Font families */
  --font-sans: ${fontFamily.sans};
  --font-mono: ${fontFamily.mono};

  /* Transition */
  --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Manual dark: data-theme="dark" on <html> */
[data-theme="dark"] {
  ${darkBlock}
}

/* Auto dark: follows OS when not explicitly set to "light" */
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) {
    ${darkBlock}
  }
}
`.trim();
}
