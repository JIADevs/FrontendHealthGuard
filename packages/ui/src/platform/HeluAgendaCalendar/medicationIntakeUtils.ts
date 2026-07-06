import type { Medication, MedicationCycle, MedicationIntake, NotTakenReason } from "@helu/api";

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

/** Extract HH:MM from ISO datetime or time string. */
export function extractIntakeTimeHHMM(value: string): string {
    if (!value) return "08:00";
    const timePart = value.includes("T") ? value.split("T")[1]! : value;
    return timePart.slice(0, 5);
}

/**
 * Builds intake clock times (HH:MM) for a calendar day from cycle schedule.
 * Example: first 08:00, every 8h → ["08:00", "16:00"]
 */
export function generateIntakeTimesForDay(
    firstIntakeTime: string,
    frequencyHours: number,
): string[] {
    if (!firstIntakeTime || frequencyHours <= 0) return [];

    const [startH, startM] = extractIntakeTimeHHMM(firstIntakeTime).split(":").map(Number);
    let minutes = startH * 60 + (startM || 0);
    const dayEndMinutes = 24 * 60;
    const step = frequencyHours * 60;
    const times: string[] = [];

    while (minutes < dayEndMinutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        minutes += step;
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
