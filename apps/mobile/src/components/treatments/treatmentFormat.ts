import type { Treatment, TreatmentDailyCheckInRef, TreatmentDetail } from "@helu/api";
import type { Tone } from "@helu/ui";
import { MOOD_CONFIG } from "../agenda/moodConfig";

export type TreatmentStatus = Treatment["status"];

/** Order of the tabs in the list (mockup «Tratamientos»): Activos · Inactivos · Completados. */
export const TREATMENT_STATUS_ORDER: TreatmentStatus[] = ["ACTIVE", "INACTIVE", "COMPLETED"];

/**
 * Status chip of the detail (Activo in brand blue, Completado in success, Inactivo in gray), the
 * tab label of the list and the one line an empty tab shows.
 */
export const TREATMENT_STATUS: Record<TreatmentStatus, { label: string; tab: string; tone: Tone; emptyTab: string }> = {
  ACTIVE: { label: "Activo", tab: "Activos", tone: "brand", emptyTab: "No tienes tratamientos activos." },
  INACTIVE: { label: "Inactivo", tab: "Inactivos", tone: "neutral", emptyTab: "No tienes tratamientos inactivos." },
  COMPLETED: { label: "Completado", tab: "Completados", tone: "success", emptyTab: "No tienes tratamientos completados." },
};

export function isTreatmentStatus(value: string): value is TreatmentStatus {
  return value === "ACTIVE" || value === "INACTIVE" || value === "COMPLETED";
}

// ─── Dates ───────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/**
 * A date-only value from the API («2026-10-10») as that calendar day on the device. Never
 * `new Date("2026-10-10")`: that is midnight UTC and shows «9 oct» in Colombia.
 */
export function dayFromDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** A timestamp from the API (`createdAt`, `recordedAt`, `uploadedAt`) as its local calendar day. */
export function dayFromTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return dayFromDate(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isToday(day: Date | null): boolean {
  return day !== null && day.getTime() === startOfToday().getTime();
}

/** «10 oct», or «10 oct 2024» when it is not the current year. */
export function shortDay(day: Date): string {
  const base = `${day.getDate()} ${MONTHS_SHORT[day.getMonth()]}`;
  return day.getFullYear() === new Date().getFullYear() ? base : `${base} ${day.getFullYear()}`;
}

/** Joins the parts of a row's second line with « · » and starts it with a capital («Hasta 15 nov»). */
export function metaLine(parts: (string | null | undefined)[]): string {
  const line = parts.filter((p): p is string => Boolean(p && p.trim())).join(" · ");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** List card (decision 8): «Desde 10 oct»; another year, «Desde mar 2024»; no start date, «Creado 3 nov». */
export function treatmentSinceLabel(treatment: Pick<Treatment, "startDate" | "createdAt">): string {
  const start = dayFromDate(treatment.startDate);
  if (start) {
    return start.getFullYear() === new Date().getFullYear()
      ? `Desde ${shortDay(start)}`
      : `Desde ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}`;
  }
  const created = dayFromTimestamp(treatment.createdAt);
  return created ? `Creado ${shortDay(created)}` : "";
}

/** Detail summary: «Inicio 10 oct · En curso», «Inicio 10 oct · Fin 30 nov», «Creado 3 nov · En curso». */
export function treatmentSubtitle(treatment: Pick<Treatment, "startDate" | "endDate" | "createdAt" | "status">): string {
  const start = dayFromDate(treatment.startDate);
  const created = dayFromTimestamp(treatment.createdAt);
  const end = dayFromDate(treatment.endDate);
  const from = start ? `Inicio ${shortDay(start)}` : created ? `Creado ${shortDay(created)}` : null;
  const until =
    treatment.status === "ACTIVE" ? (end ? `Hasta ${shortDay(end)}` : "En curso") : end ? `Fin ${shortDay(end)}` : null;
  return [from, until].filter(Boolean).join(" · ");
}

// ─── Search ──────────────────────────────────────────────────────────────────

/** Accents and case ignored: «migrana» finds «Migraña». */
function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** On-device search over the name and the description (the API has no search, #35). */
export function treatmentMatches(treatment: Pick<Treatment, "name" | "description">, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return fold(`${treatment.name} ${treatment.description ?? ""}`).includes(q);
}

// ─── Detail ──────────────────────────────────────────────────────────────────

/** Nothing linked yet: the detail shows «¿Qué incluye este tratamiento?» instead of the sections. */
export function hasNothingLinked(detail: TreatmentDetail): boolean {
  return (
    detail.medicationCycles.length === 0 &&
    detail.appointments.length === 0 &&
    detail.documents.length === 0 &&
    detail.dailyCheckins.length === 0 &&
    detail.symptoms.length === 0
  );
}

/** «1 documento», «3 documentos». */
function countLabel(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

const MAX_CHIPS = 3;

/**
 * Chips of a list card (mockup «Tratamientos», decision 8 revisited): what the treatment groups, worked
 * out from its detail because the list API has no counts. The medication by name when there is one
 * («Metformina»), else «2 medicamentos»; then documents, appointments and check-ins; three at most.
 * Missions and the specialty have no API (#35), so «1 misión» and «· Ortopedia» never show.
 */
export function treatmentChips(detail: TreatmentDetail): string[] {
  const medications = new Map<string, string>();
  for (const cycle of detail.medicationCycles) medications.set(cycle.medicationId, cycle.medicationName);
  const chips: string[] = [];
  if (medications.size === 1) chips.push([...medications.values()][0]!);
  if (medications.size > 1) chips.push(`${medications.size} medicamentos`);
  if (detail.documents.length > 0) chips.push(countLabel(detail.documents.length, "documento", "documentos"));
  if (detail.appointments.length > 0) chips.push(countLabel(detail.appointments.length, "cita", "citas"));
  if (detail.dailyCheckins.length > 0) chips.push(countLabel(detail.dailyCheckins.length, "check-in", "check-ins"));
  return chips.slice(0, MAX_CHIPS);
}

const MAX_FACES = 5;
const TREND_DAYS = 7;

/**
 * Check-ins of a treatment: up to 5 faces, oldest to newest, and a sentence from the last 7 days
 * comparing the first and the last mood. With fewer than 2 check-ins that week there is no sentence.
 */
export function moodTrend(checkIns: TreatmentDailyCheckInRef[]): {
  faces: TreatmentDailyCheckInRef[];
  sentence: string | null;
} {
  const sorted = [...checkIns].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const faces = sorted.slice(-MAX_FACES);
  const since = startOfToday();
  since.setDate(since.getDate() - (TREND_DAYS - 1));
  const week = sorted.filter((c) => {
    const day = dayFromTimestamp(c.recordedAt);
    return day !== null && day >= since;
  });
  if (week.length < 2) return { faces, sentence: null };
  const first = MOOD_CONFIG[week[0]!.mood];
  const last = MOOD_CONFIG[week[week.length - 1]!.mood];
  if (last.score > first.score) return { faces, sentence: `De «${first.label}» a «${last.label}»: mejorando esta semana` };
  if (last.score < first.score) return { faces, sentence: `De «${first.label}» a «${last.label}» esta semana` };
  return { faces, sentence: "Estable esta semana" };
}
