/**
 * Formateadores de datos compartidos entre web y mobile.
 */

// ─── Fechas ──────────────────────────────────────────────────────────────────

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

/** Formatea un string datetime (con timezone) en formato legible es-CO. */
export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", DATE_OPTS);
}

/**
 * Formatea un string de fecha-sola (ej: "2024-03-21") sin desplazamiento
 * de timezone. Usar para fechas de citas/medicamentos que no incluyen hora.
 */
export function formatDateLocal(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", DATE_OPTS);
}

// ─── Archivos ────────────────────────────────────────────────────────────────

/** Convierte bytes a KB legibles. Devuelve "—" si el valor es nulo. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  return `${(bytes / 1024).toFixed(0)} KB`;
}
