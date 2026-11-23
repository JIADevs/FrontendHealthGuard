import { formatClock } from "../../utils/formatters";
import type {
    MoodEnum,
    AgendaTask,
    Appointment,
    CalendarDay,
    DailyCheckIn,
    Medication,
    MedicationIntake,
} from "@helu/api";
import { localDateKeyFromISO } from "./calendarDateUtils";
import { MOOD_LABEL_ES } from "./moodEmoji";
import {
    generateIntakeTimesForDay,
    medicationIntakeSortKey,
    resolveCycleForDay,
    findIntakeForSlot,
    formatMedDose,
    NOT_TAKEN_REASON_LABELS_ES,
} from "./medicationIntakeUtils";

export type AgendaEvent =
    | { type: "appointment"; data: Appointment; sortKey: number }
    | { type: "exam"; data: Appointment; sortKey: number }
    | { type: "checkin"; data: DailyCheckIn; sortKey: number }
    | {
          type: "medication";
          data: Medication;
          cycleId: string;
          dayKey: string;
          intakeTime: string;
          intake?: MedicationIntake;
          sortKey: number;
      }
    | {
          type: "task";
          data: AgendaTask;
          /** Calendar day from API aggregate (America/Bogota bucketing). */
          dayKey: string;
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
        const cycle = resolveCycleForDay(med, dayKey);
        if (!cycle) continue;

        const intakeTimes = generateIntakeTimesForDay(cycle.firstIntakeTime, cycle.frequency, dayKey, cycle.frequencyUnit);
        for (const intakeTime of intakeTimes) {
            events.push({
                type: "medication",
                data: med,
                cycleId: cycle.id,
                dayKey,
                intakeTime,
                intake: findIntakeForSlot(cycle, dayKey, intakeTime),
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
        for (const task of day.tasks ?? []) {
            events.push({
                type: "task",
                data: task,
                dayKey: day.date,
                sortKey: new Date(task.startAt).getTime(),
            });
        }
    }

    return events.sort((a, b) => a.sortKey - b.sortKey);
}

export function filterEventsForDates(events: AgendaEvent[], dates: string[]): AgendaEvent[] {
    const dateSet = new Set(dates);
    return events.filter((event) => {
        if (event.type === "checkin") {
            return dateSet.has(localDateKeyFromISO(event.data.recordedAt));
        }
        if (event.type === "medication" || event.type === "task") {
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
    if (event.type === "task") {
        const d = new Date(event.data.startAt);
        return d.getHours() + d.getMinutes() / 60;
    }
    const timePart = event.data.time?.slice(0, 5) ?? "09:00";
    const [h, m] = timePart.split(":").map(Number);
    return h + (m || 0) / 60;
}

export function eventDetailLine(event: AgendaEvent): string {
    if (event.type === "medication") {
        const dose = formatMedDose(event.data.doseAmount, event.data.doseUnit, event.data.dosage);
        if (event.intake?.status === "TAKEN") {
            const takenAtMs = event.intake.takenAt ? new Date(event.intake.takenAt).getTime() : NaN;
            const scheduledMs = new Date(event.intake.scheduledTime).getTime();
            const isLate = Number.isFinite(takenAtMs) && takenAtMs - scheduledMs > 5 * 60_000;
            return isLate ? "Toma · Tomado tarde" : "Toma · Tomado";
        }
        if (event.intake?.status === "NOT_TAKEN") {
            const reason = event.intake.notTakenReason
                ? NOT_TAKEN_REASON_LABELS_ES[event.intake.notTakenReason]
                : "";
            return reason ? `Toma · ${reason}` : "Toma · No tomado";
        }
        return dose ? `Toma · ${dose}` : "Toma";
    }
    // «Check-in · 5:32 a. m. · Check-in» repeated the type: say the module and the mood instead.
    if (event.type === "checkin") {
        const mood = MOOD_LABEL_ES[event.data.mood as MoodEnum];
        return mood ? `Bienestar · ${mood}` : "Bienestar";
    }
    if (event.type === "task") {
        return event.data.status === "completed" ? "Tarea · Completada" : "Tarea";
    }
    const who = event.data.doctor || event.data.specialty;
    if (event.type === "exam") return who ? `Examen · ${who}` : "Examen";
    return who ? `Cita · ${who}` : "Cita";
}

/** Hora del evento en formato es-CO («1:00 p. m.») para el metadato de la lista del día. */
export function eventTimeLabel(event: AgendaEvent): string {
    if (event.type === "medication") return formatClock(event.intakeTime);
    if (event.type === "checkin") return formatClock(new Date(event.data.recordedAt));
    if (event.type === "task") return formatClock(new Date(event.data.startAt));
    return event.data.time ? formatClock(event.data.time.slice(0, 5)) : "Todo el día";
}

export function eventLabel(event: AgendaEvent): string {
    if (event.type === "checkin") {
        return "Check-in";
    }
    if (event.type === "medication") {
        return event.data.name;
    }
    if (event.type === "task") {
        return event.data.title || "Tarea";
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
        case "task":
            return `task-${event.data.id}-${event.dayKey}`;
    }
}
