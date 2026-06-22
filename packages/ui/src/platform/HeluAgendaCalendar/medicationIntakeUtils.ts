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
