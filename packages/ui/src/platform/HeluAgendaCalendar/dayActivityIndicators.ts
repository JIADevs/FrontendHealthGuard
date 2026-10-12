import type { CalendarDay } from "@helu/api";
import { generateIntakeTimesForDay, resolveCycleForDay } from "./medicationIntakeUtils";

export interface DayActivityIndicators {
    hasAppointments: boolean;
    hasMedications: boolean;
    hasCheckIn: boolean;
}

/**
 * The backend only checks whether a medication's cycle date range covers the day, not
 * whether the day actually lands on the dosing schedule (e.g. "every 2 weeks"). Resolve
 * the cycle in effect and check the real interval, the same way the day-detail view does
 * via mapMedicationIntakesForDay, so month-view dots don't show on every day of the cycle.
 */
function dayHasScheduledMedication(day: CalendarDay): boolean {
    return day.medications.some((med) => {
        const cycle = resolveCycleForDay(med, day.date);
        if (!cycle) return false;
        return generateIntakeTimesForDay(cycle.firstIntakeTime, cycle.frequency, day.date, cycle.frequencyUnit).length > 0;
    });
}

export function buildDayActivityMap(days: CalendarDay[]): Map<string, DayActivityIndicators> {
    const map = new Map<string, DayActivityIndicators>();

    for (const day of days) {
        map.set(day.date, {
            hasAppointments: day.appointments.length > 0,
            hasMedications: dayHasScheduledMedication(day),
            hasCheckIn: day.checkIns.length > 0,
        });
    }

    return map;
}

export function emptyDayActivity(): DayActivityIndicators {
    return {
        hasAppointments: false,
        hasMedications: false,
        hasCheckIn: false,
    };
}
