import type { Medication, MedicationCycle, MedicationIntake, NotTakenReason } from "@helu/api";
import { localDateKeyFromISO } from "./calendarDateUtils";

export const NOT_TAKEN_REASON_LABELS_ES: Record<NotTakenReason, string> = {
    FORGOT: "Se me olvidó",
    NOT_PURCHASED: "No lo compré",
    OTHER: "Otro",
};

/**
 * The calendar attaches every cycle a medication has ever had to each day it renders
 * (the backend only checks whether *any* cycle covers the day). Pick the one whose
 * date range actually covers this specific day, instead of assuming cycles[0].
 */
export function resolveCycleForDay(medication: Medication, dayKey: string): MedicationCycle | undefined {
    return medication.cycles.find((cycle) => {
        const start = cycle.startDate.slice(0, 10);
        const end = cycle.endDate ? cycle.endDate.slice(0, 10) : "9999-12-31";
        return start <= dayKey && dayKey <= end;
    });
}

/** Find the logged intake (if any) for a given day+clock-time slot, comparing within the same minute. */
export function findIntakeForSlot(
    cycle: MedicationCycle,
    dayKey: string,
    intakeTime: string,
): MedicationIntake | undefined {
    const slotMs = new Date(`${dayKey}T${intakeTime}`).getTime();
    return cycle.intakes.find((intake) => Math.abs(new Date(intake.scheduledTime).getTime() - slotMs) < 60_000);
}

/**
 * Extract HH:MM from an ISO datetime (converted to device local time, since the API
 * returns UTC-aware timestamps) or from a bare "HH:MM" time string.
 */
export function extractIntakeTimeHHMM(value: string): string {
    if (!value) return "08:00";
    if (!value.includes("T")) return value.slice(0, 5);
    const d = new Date(value);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

/** Whole calendar days between two "YYYY-MM-DD" local date keys (`to` − `from`). */
function daysBetweenKeys(fromKey: string, toKey: string): number {
    const [fy, fm, fd] = fromKey.split("-").map(Number);
    const [ty, tm, td] = toKey.split("-").map(Number);
    const from = Date.UTC(fy, fm - 1, fd);
    const to = Date.UTC(ty, tm - 1, td);
    return Math.round((to - from) / 86_400_000);
}

/**
 * Whether `dayKey` is one of the recurring days for a DAY/WEEK/MONTH/YEAR cycle anchored
 * at `anchorKey` (the local calendar date of `firstIntakeTime`), e.g. frequency=3, unit=DAY
 * matches every 3rd day starting at the anchor, not every day in the cycle's date range.
 */
function dayMatchesInterval(
    anchorKey: string,
    dayKey: string,
    frequency: number,
    frequencyUnit: string,
): boolean {
    const [ay, am, ad] = anchorKey.split("-").map(Number);
    const [dy, dm, dd] = dayKey.split("-").map(Number);

    if (frequencyUnit === "WEEK") {
        const diffDays = daysBetweenKeys(anchorKey, dayKey);
        return diffDays >= 0 && diffDays % (frequency * 7) === 0;
    }
    if (frequencyUnit === "MONTH") {
        const monthsDiff = (dy - ay) * 12 + (dm - am);
        return dd === ad && monthsDiff >= 0 && monthsDiff % frequency === 0;
    }
    if (frequencyUnit === "YEAR") {
        const yearsDiff = dy - ay;
        return dd === ad && dm === am && yearsDiff >= 0 && yearsDiff % frequency === 0;
    }
    // DAY (default for any other non-HOUR unit)
    const diffDays = daysBetweenKeys(anchorKey, dayKey);
    return diffDays >= 0 && diffDays % frequency === 0;
}

/**
 * Builds intake clock times (HH:MM) for a calendar day from cycle schedule.
 * "HOUR"-unit frequencies roll continuously across midnight from the anchor instant
 * (e.g. first 17:00, every 3h → day 1: 17:00, 20:00, 23:00; day 2 keeps stepping from
 * there: 02:00, 05:00, ... — it does NOT restart at 17:00 each day). DAY/WEEK/MONTH/YEAR
 * frequencies produce a single intake at firstIntakeTime's clock time, but only on days
 * that actually land on the interval (e.g. every 3 days: the anchor day, +3, +6, ...) —
 * not every day the cycle covers.
 */
export function generateIntakeTimesForDay(
    firstIntakeTime: string,
    frequency: number,
    dayKey: string,
    frequencyUnit: string = "HOUR",
): string[] {
    if (!firstIntakeTime || frequency <= 0) return [];

    const startTime = extractIntakeTimeHHMM(firstIntakeTime);
    const anchorKey = localDateKeyFromISO(firstIntakeTime);

    if (frequencyUnit !== "HOUR") {
        return dayMatchesInterval(anchorKey, dayKey, frequency, frequencyUnit) ? [startTime] : [];
    }

    const dayIndex = daysBetweenKeys(anchorKey, dayKey);
    if (dayIndex < 0) return [];

    const [startH, startM] = startTime.split(":").map(Number);
    const anchorMinutesOfDay = startH * 60 + (startM || 0);
    const stepMinutes = frequency * 60;

    // Minutes elapsed since the anchor instant at this day's local midnight / next midnight.
    const dayStartRelative = dayIndex * 1440 - anchorMinutesOfDay;
    const dayEndRelative = dayStartRelative + 1440;
    const firstStep = Math.max(0, Math.ceil(dayStartRelative / stepMinutes));

    const times: string[] = [];
    for (let t = firstStep * stepMinutes; t < dayEndRelative; t += stepMinutes) {
        const clockMinutes = ((t + anchorMinutesOfDay) % 1440 + 1440) % 1440;
        const h = Math.floor(clockMinutes / 60);
        const m = clockMinutes % 60;
        times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }

    return times;
}

export function medicationIntakeSortKey(dayKey: string, intakeTime: string): number {
    return new Date(`${dayKey}T${intakeTime}:00`).getTime();
}

const DOSE_UNIT_ES: Record<string, string> = {
    TABLET: "tableta(s)",
    ML:     "ml",
    DROPS:  "gotas",
    GRAMS:  "gramos",
    MG:     "mg",
    UNITS:  "unidad(es)",
};

export function formatMedDose(
    doseAmount: number | null | undefined,
    doseUnit: string | null | undefined,
    fallback: string,
): string {
    const label = doseUnit ? (DOSE_UNIT_ES[doseUnit] ?? doseUnit.toLowerCase()) : "";
    if (doseAmount != null && label) return `${doseAmount} ${label}`;
    if (doseAmount != null) return String(doseAmount);
    return fallback;
}
