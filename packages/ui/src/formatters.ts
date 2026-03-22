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

/** Formatea la parte de hora de un datetime (hh:mm). */
export function formatTime(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Devuelve la fecha actual como string ISO-8601 (YYYY-MM-DD).
 * Útil para valores de inputs `type="date"` y filtros de API con startDate.
 */
export function todayISODate(): string {
  return new Date().toISOString().split("T")[0]!;
}

/** Tiempo relativo compacto (ahora / hace Nm / hace Nh / hace Nd). */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

// ─── Archivos ────────────────────────────────────────────────────────────────

/** Convierte bytes a KB legibles. Devuelve "—" si el valor es nulo. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// ─── Dominio: citas ───────────────────────────────────────────────────────────

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING:      "Pendiente",
  COMPLETED:    "Realizada",
  CANCELLED:    "Cancelada",
  RESCHEDULED:  "Re-agendada",
};

/** Convierte un status de cita a su etiqueta en español. */
export function appointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}
