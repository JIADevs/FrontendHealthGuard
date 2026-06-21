import type { CalendarDay } from "@helu/api";

export interface DayActivityIndicators {
    hasAppointments: boolean;
    hasMedications: boolean;
    hasCheckIn: boolean;
}

export function buildDayActivityMap(days: CalendarDay[]): Map<string, DayActivityIndicators> {
    const map = new Map<string, DayActivityIndicators>();

    for (const day of days) {
        map.set(day.date, {
            hasAppointments: day.appointments.length > 0,
            hasMedications: day.medications.length > 0,
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
