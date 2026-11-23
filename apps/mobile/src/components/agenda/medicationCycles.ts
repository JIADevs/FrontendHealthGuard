import type { Medication, MedicationCycle } from "@helu/api";
import { findIntakeForSlot, formatClock, formatShortDay, generateIntakeTimesForDay } from "@helu/ui";

const DAY_MS = 86_400_000;

/** «YYYY-MM-DD» of a local date (the calendar's day key). */
function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Local midnight of a date. A bare «YYYY-MM-DD» is read as a local date; a full timestamp
 * («2026-08-05T05:00:00Z», how the API sends cycle dates) is converted to local time first.
 */
function startOfLocalDay(value: string | number | Date): number {
  const d =
    typeof value === "string" && value.length <= 10
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * A cycle is active until the end of its last day (local time). Same rule as the backend's
 * `status=active` filter: no end date, or an end date that has not passed yet.
 */
export function isCycleActive(cycle: MedicationCycle, now = Date.now()): boolean {
  if (!cycle.endDate) return true;
  return startOfLocalDay(cycle.endDate) + DAY_MS > now;
}

/** A medication is active when any of its cycles is (inicio-agenda.md · Medicamentos v2). */
export function isMedicationActive(medication: Medication, now = Date.now()): boolean {
  return (medication.cycles ?? []).some((cycle) => isCycleActive(cycle, now));
}

/**
 * The cycle the list and the detail talk about: the active one with the nearest next dose,
 * or, for a finished medication, the one that ended last.
 */
export function currentCycleOf(medication: Medication, now = Date.now()): MedicationCycle | undefined {
  const cycles = medication.cycles ?? [];
  const active = cycles.filter((cycle) => isCycleActive(cycle, now));
  if (active.length > 0) {
    return [...active].sort((a, b) => nextDoseMs(a) - nextDoseMs(b))[0];
  }
  return [...cycles].sort((a, b) => endMs(b) - endMs(a))[0];
}

function nextDoseMs(cycle: MedicationCycle): number {
  const t = cycle.nextIntakeTime ? new Date(cycle.nextIntakeTime).getTime() : NaN;
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

function endMs(cycle: MedicationCycle): number {
  return cycle.endDate ? startOfLocalDay(cycle.endDate) : Number.NEGATIVE_INFINITY;
}

export interface CycleDayProgress {
  /** Days lived in the cycle, counting today (0 before it starts). */
  day: number;
  /** Total days, or null for a cycle without an end date. */
  total: number | null;
  /** 0–1 for the progress bar; null when there is no end date to measure against. */
  ratio: number | null;
}

export function cycleDayProgress(cycle: MedicationCycle, now = Date.now()): CycleDayProgress {
  const start = startOfLocalDay(cycle.startDate);
  const today = startOfLocalDay(now);
  const total = cycle.endDate ? Math.round((startOfLocalDay(cycle.endDate) - start) / DAY_MS) + 1 : null;
  const lived = Math.round((today - start) / DAY_MS) + 1;
  const day = Math.max(0, total != null ? Math.min(lived, total) : lived);
  return { day, total, ratio: total ? day / total : null };
}

/** «hoy 1:00 p. m.», «mañana 7:00 a. m.» or «Jue 5 nov · 7:00 a. m.». */
export function formatNextDose(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "";
  const diffDays = Math.round((startOfLocalDay(when) - startOfLocalDay(now)) / DAY_MS);
  const clock = formatClock(when);
  if (diffDays === 0) return `hoy ${clock}`;
  if (diffDays === 1) return `mañana ${clock}`;
  return `${midSentenceDay(when)} · ${clock}`;
}

/** «Terminó el Jue 3 dic» for a finished cycle. */
export function formatCycleEnd(cycle: MedicationCycle | undefined): string {
  if (!cycle?.endDate) return "Sin ciclo activo";
  return `Terminó el ${midSentenceDay(cycle.endDate)}`;
}

/** «Dom 22 nov» → «dom 22 nov»: these always follow other words, and weekdays are lowercase in Spanish. */
function midSentenceDay(value: string | Date): string {
  const day = formatShortDay(value);
  return day.charAt(0).toLowerCase() + day.slice(1);
}

export interface RecentAdherence {
  /** Doses of the window marked «Tomado». */
  taken: number;
  /** Doses the schedule asked for in the window, up to now. */
  due: number;
  /** Days the window covers (fewer than `days` when the cycle started inside it). */
  days: number;
}

/**
 * For a cycle without an end date there is no «X de N días»: the list shows how many of the doses
 * scheduled in the last `days` days (today included, only those whose time already came) were
 * marked as taken. Same slots as the calendar (`generateIntakeTimesForDay`) and the same matching
 * of a recorded intake to its slot (`findIntakeForSlot`). Null when nothing was due yet.
 */
export function recentAdherence(cycle: MedicationCycle, now = Date.now(), days = 7): RecentAdherence | null {
  const firstMs = new Date(cycle.firstIntakeTime).getTime();
  const startMs = Math.max(startOfLocalDay(cycle.startDate), Number.isFinite(firstMs) ? firstMs : -Infinity);
  let taken = 0;
  let due = 0;
  let covered = 0;
  for (let back = days - 1; back >= 0; back -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - back);
    const dayKey = localDateKey(day);
    if (startOfLocalDay(dayKey) + DAY_MS <= startOfLocalDay(startMs)) continue;
    covered += 1;
    for (const time of generateIntakeTimesForDay(cycle.firstIntakeTime, cycle.frequency, dayKey, cycle.frequencyUnit)) {
      const slotMs = new Date(`${dayKey}T${time}`).getTime();
      if (slotMs < startMs - 60_000 || slotMs > now) continue;
      due += 1;
      if (findIntakeForSlot(cycle, dayKey, time)?.status === "TAKEN") taken += 1;
    }
  }
  return due > 0 ? { taken, due, days: covered } : null;
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** «21 nov», plus the year when it is not the current one. Reads the calendar day the API stores. */
export function formatDayMonth(value: string): string {
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** «21 nov – 21 dic», or «Desde 21 nov» for a cycle with no end date (mockup «Detalle de medicamento»). */
export function formatCycleRange(cycle: MedicationCycle): string {
  const start = formatDayMonth(cycle.startDate);
  return cycle.endDate ? `${start} – ${formatDayMonth(cycle.endDate)}` : `Desde ${start}`;
}

export type CycleStatus = "active" | "ends-today" | "finished";

/**
 * «En curso», «Termina hoy» or «Finalizado». A cycle finished today keeps counting today's doses until
 * midnight, but it must not look untouched right after «Finalizar ciclo».
 */
export function cycleStatus(cycle: MedicationCycle, now = Date.now()): CycleStatus {
  if (!isCycleActive(cycle, now)) return "finished";
  const d = new Date(now);
  const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return cycle.endDate?.slice(0, 10) === todayKey ? "ends-today" : "active";
}

export const CYCLE_STATUS_CHIP: Record<CycleStatus, { label: string; tone: "brand" | "warning" | "neutral" }> = {
  active: { label: "En curso", tone: "brand" },
  "ends-today": { label: "Termina hoy", tone: "warning" },
  finished: { label: "Finalizado", tone: "neutral" },
};
