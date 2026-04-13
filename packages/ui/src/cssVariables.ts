import { colors, surface, border, radii, overlay, fontFamily } from "./tokens";
import { darkTheme, lightTheme } from "./theme";

/**
 * Genera el bloque CSS :root (light) + @media dark con todas las variables del sistema de diseño.
 * Úsalo en Next.js para eliminar los colores hardcodeados de globals.css.
 *
 * @example
 *   // app/layout.tsx
 *   <style dangerouslySetInnerHTML={{ __html: generateCssVariables() }} />
 */
export function generateCssVariables(): string {
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
  --text-muted:     ${lightTheme.text.muted};
  --text-sidebar:   ${colors.slate[200]};

  /* Botón secondary / ghost (light) — los componentes web leen esto en dark mode */
  --btn-secondary-bg:        ${colors.white};
  --btn-secondary-bg-hover:    ${colors.gray[50]};
  --btn-secondary-color:       ${colors.gray[700]};
  --btn-secondary-border:      ${colors.gray[200]};
  --btn-ghost-hover-bg:        ${colors.primary[50]};

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

@media (prefers-color-scheme: dark) {
  :root {
    /* Surfaces (dark mode) */
    --bg:               ${darkTheme.surface.bg};
    --bg-card:          ${darkTheme.surface.bgCard};
    --bg-sidebar:       ${darkTheme.surface.bgSidebar ?? "#020617"};
    --bg-sidebar-hover: ${darkTheme.surface.bgSidebarHover};

    /* Text (dark mode) */
    --text-primary:   ${darkTheme.text.primary};
    --text-secondary: ${darkTheme.text.secondary};
    --text-muted:     ${darkTheme.text.muted};

    /* Border (dark mode) */
    --border: ${darkTheme.border.default};

    --btn-secondary-bg:        ${colors.slate[700]};
    --btn-secondary-bg-hover:  ${colors.slate[600]};
    --btn-secondary-color:     ${colors.slate[100]};
    --btn-secondary-border:    ${colors.slate[600]};
    --btn-ghost-hover-bg:      rgba(59, 130, 246, 0.18);

    /* Shadows more visible on dark */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.25);
  }
}
`.trim();
}
