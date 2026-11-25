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
  // A date-only string is a calendar day; a full timestamp (e.g. `uploadedAt`) is shown on the
  // user's local day. Appending «T00:00:00» to a timestamp gave «Invalid Date».
  const date = d.length > 10 ? new Date(d) : new Date(d + "T00:00:00");
  return date.toLocaleDateString("es-CO", DATE_OPTS);
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
  // The user's calendar day, not the UTC one: appointments store local dates, and after 7 p. m. in
  // Colombia the UTC date is already tomorrow.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Formatea una fecha-sola de cita con día de semana corto (sin año).
 * Ej: "lun. 21 mar."
 * Compartido entre web y mobile para la vista de agenda.
 */
export function formatApptDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
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

/** Convierte bytes a unidad legible (B / KB / MB). Devuelve "—" si el valor es nulo. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/** Fecha compacta para listas (ej. "12 mar"). */
export function formatShortDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

// ─── Dominio: citas ───────────────────────────────────────────────────────────

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PROGRAMADA:   "Programada",
  ASISTI:       "Asistí",
  CANCELADA:    "Cancelada",
  NO_ASISTI:    "No asistí",
  // Legacy English statuses
  PENDING:      "Pendiente",
  COMPLETED:    "Realizada",
  CANCELLED:    "Cancelada",
  RESCHEDULED:  "Reprogramada",
};

/** Convierte un status de cita a su etiqueta en español. */
export function appointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}

// ─── Dashboard helpers ───────────────────────────────────────────────────────

/** Splits "2026-04-27" → { day: "27", month: "abr" } for date badges. */
export function splitDate(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDate().toString();
  const month = d.toLocaleDateString("es", { month: "short" }).replace(".", "");
  return { day, month };
}

/** Formats a file extension / MIME into a friendly label for document cards. */
export function formatFileKind(format: string | null | undefined): string {
  if (!format) return "—";
  const f = format.toLowerCase();
  if (f.includes("pdf")) return "PDF";
  if (f.includes("png") || f.includes("jpg") || f.includes("jpeg") || f.includes("webp")) return "Imagen";
  return format.toUpperCase();
}

// ─── Formato v2 (formularios.md §8): «Jue 5 nov», «1:00 p. m.» ──────────────

const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/**
 * Hora en formato es-CO de 12 horas: «1:00 p. m.», «10:30 a. m.».
 * Acepta «HH:mm», «HH:mm:ss» o un `Date`.
 */
export function formatClock(value: string | Date | null | undefined): string {
  if (!value) return "";
  let h: number;
  let m: number;
  if (value instanceof Date) {
    h = value.getHours();
    m = value.getMinutes();
  } else {
    const [hh, mm] = value.split(":").map(Number);
    if (!Number.isFinite(hh)) return value;
    h = hh;
    m = Number.isFinite(mm) ? mm : 0;
  }
  // Non-breaking spaces (U+00A0): a time is clinical data and must never wrap as «11:21 p.» / «m.».
  const suffix = h < 12 ? "a.\u00a0m." : "p.\u00a0m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}\u00a0${suffix}`;
}

/**
 * Fecha corta con día de la semana: «Jue 5 nov». Agrega el año si no es el actual
 * («Jue 17 sep 2025»). Acepta «YYYY-MM-DD» (sin desplazamiento de zona) o un `Date`.
 */
export function formatShortDay(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const base = `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`;
}
