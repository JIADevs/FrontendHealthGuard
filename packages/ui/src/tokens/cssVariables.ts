import { colors, surface, border, radii, overlay, fontFamily } from "./tokens";
import { darkTheme } from "./theme";

/**
 * Genera el bloque CSS :root (light) + dark mode con todas las variables del sistema de diseño.
 * Dark mode se activa por:
 *   1. data-theme="dark" en el <html> (toggle manual)
 *   2. @media (prefers-color-scheme: dark) si data-theme="light" NO está definido
 */
export function generateCssVariables(): string {
  const darkBlock = `
    /* Surfaces (dark mode) */
    --bg:               ${darkTheme.surface.bg};
    --bg-card:          ${darkTheme.surface.bgCard};
    --bg-sidebar:       ${darkTheme.surface.bgSidebar};
    --bg-sidebar-hover: ${darkTheme.surface.bgSidebarHover};

    /* Text (dark mode) */
    --text-primary:   ${darkTheme.text.primary};
    --text-secondary: ${darkTheme.text.secondary};

    /* Border (dark mode) */
    --border: ${darkTheme.border.default};

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
    --primary-50:  rgba(59, 130, 246, 0.12);
    --primary-200: rgba(59, 130, 246, 0.25);
    --primary-300: rgba(59, 130, 246, 0.35);
    --error-50:    rgba(239, 68, 68, 0.12);
    --success-50:  rgba(34, 197, 94, 0.12);
    --warning-50:  rgba(234, 179, 8, 0.12);

    /* Focus rings (more visible on dark) */
    --primary-ring-sm: rgba(59, 130, 246, 0.25);
    --primary-ring-md: rgba(59, 130, 246, 0.30);

    /* Shadows more visible on dark */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.25);
  `;

  return `
:root {
  /* Primary */
  --primary-50:  ${colors.primary[50]};
  --primary-100: ${colors.primary[100]};
  --primary-200: ${colors.primary[200]};
  --primary-300: ${colors.primary[300]};
  --primary-400: ${colors.primary[400]};
  --primary-500: ${colors.primary[500]};
  --primary-600: ${colors.primary[600]};
  --primary-700: ${colors.primary[700]};
  --primary-800: ${colors.primary[800]};
  --primary-900: ${colors.primary[900]};

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
  --primary-ring-sm: rgba(59, 130, 246, 0.12);
  --primary-ring-md: rgba(59, 130, 246, 0.15);
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
