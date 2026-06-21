import type { Appointment, CalendarDay, DailyCheckIn, Medication } from "@helu/api";
import { localDateKeyFromISO } from "./calendarDateUtils";
import {
    generateIntakeTimesForDay,
    medicationIntakeSortKey,
} from "./medicationIntakeUtils";

export type AgendaEvent =
    | { type: "appointment"; data: Appointment; sortKey: number }
    | { type: "exam"; data: Appointment; sortKey: number }
    | { type: "checkin"; data: DailyCheckIn; sortKey: number }
    | {
          type: "medication";
          data: Medication;
          dayKey: string;
          intakeTime: string;
          sortKey: number;
      };

function appointmentSortKey(appt: Appointment): number {
    const datePart = appt.date?.slice(0, 10) ?? "1970-01-01";
    const timePart = appt.time?.slice(0, 5) ?? "09:00";
    return new Date(`${datePart}T${timePart}:00`).getTime();
}

function checkInSortKey(checkIn: DailyCheckIn): number {
    return new Date(checkIn.recordedAt).getTime();
}

function mapMedicationIntakesForDay(dayKey: string, medications: Medication[]): AgendaEvent[] {
    const events: AgendaEvent[] = [];

    for (const med of medications) {
        const intakeTimes = generateIntakeTimesForDay(med.firstIntakeTime, med.frequency);
        for (const intakeTime of intakeTimes) {
            events.push({
                type: "medication",
                data: med,
                dayKey,
                intakeTime,
                sortKey: medicationIntakeSortKey(dayKey, intakeTime),
            });
        }
    }

    return events;
}

export function mapCalendarApiToEvents(days: CalendarDay[]): AgendaEvent[] {
    const events: AgendaEvent[] = [];

    for (const day of days) {
        for (const appt of day.appointments) {
            const sortKey = appointmentSortKey(appt);
            events.push({
                type: appt.type === "EXAM" ? "exam" : "appointment",
                data: appt,
                sortKey,
            });
        }
        for (const checkIn of day.checkIns) {
            events.push({
                type: "checkin",
                data: checkIn,
                sortKey: checkInSortKey(checkIn),
            });
        }
        events.push(...mapMedicationIntakesForDay(day.date, day.medications));
    }

    return events.sort((a, b) => a.sortKey - b.sortKey);
}

export function filterEventsForDates(events: AgendaEvent[], dates: string[]): AgendaEvent[] {
    const dateSet = new Set(dates);
    return events.filter((event) => {
        if (event.type === "checkin") {
            return dateSet.has(localDateKeyFromISO(event.data.recordedAt));
        }
        if (event.type === "medication") {
            return dateSet.has(event.dayKey);
        }
        const dateKey = event.data.date?.slice(0, 10);
        return dateKey ? dateSet.has(dateKey) : false;
    });
}

export function eventHourFraction(event: AgendaEvent): number {
    if (event.type === "checkin") {
        const d = new Date(event.data.recordedAt);
        return d.getHours() + d.getMinutes() / 60;
    }
    if (event.type === "medication") {
        const [h, m] = event.intakeTime.split(":").map(Number);
        return h + (m || 0) / 60;
    }
    const timePart = event.data.time?.slice(0, 5) ?? "09:00";
    const [h, m] = timePart.split(":").map(Number);
    return h + (m || 0) / 60;
}

export function eventLabel(event: AgendaEvent): string {
    if (event.type === "checkin") {
        return "Check-in";
    }
    if (event.type === "medication") {
        return event.data.name;
    }
    if (event.type === "exam") {
        return event.data.name || event.data.examType || "Examen";
    }
    return event.data.name || event.data.specialty || "Cita médica";
}

export function eventKey(event: AgendaEvent, index: number): string {
    switch (event.type) {
        case "appointment":
        case "exam":
            return `${event.type}-${event.data.id}-${index}`;
        case "checkin":
            return `checkin-${event.data.id}`;
        case "medication":
            return `medication-${event.data.id}-${event.dayKey}-${event.intakeTime}`;
    }
}
