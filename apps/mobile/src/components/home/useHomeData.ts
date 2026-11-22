import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAppointmentsQuery,
  useCalendarEventsQuery,
  useDailyCheckInsQuery,
  useDashboardCore,
  useNotificationsQuery,
  useProfileQuery,
} from "@helu/api/hooks";
import { filterEventsForDates, formatClock, formatShortDay, mapCalendarApiToEvents, todayLocalDateKey } from "@helu/ui";
import type { AgendaEvent } from "@helu/ui";
import type { MascotPose } from "../brand";
import { doseStateForEvent } from "../agenda/doseRowState";
import type { StreakDay } from "./StreakCard";
import type { SetupState } from "./SetupChecklist";
import { useSetupHidden } from "./useSetupHidden";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

const WEEK_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** «a la 1:00 p. m.», «a las 9:00 p. m.»: el artículo sigue a la hora en reloj de 12 horas. */
function atClock(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2)) % 12 || 12;
  return `${h === 1 ? "a la" : "a las"} ${formatClock(hhmm)}`;
}

/** Cierra la frase sin duplicar el punto de «p. m.». */
function sentence(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.endsWith(".") ? clean : `${clean}.`;
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

/**
 * Datos de Inicio (inicio-agenda.md · Inicio): tomas de hoy, lo siguiente del día, la semana de
 * check-ins, la racha y el primer uso. Todo sale de las consultas que ya existen; nada se inventa.
 */
export function useHomeData() {
  const dash = useDashboardCore();
  const profile = useProfileQuery();
  const setup = useSetupHidden();

  // Hoy y mañana en días locales: la clave de la consulta no cambia durante el día.
  const days = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { todayKey: todayLocalDateKey(), tomorrowKey: localKey(tomorrow), monday, sunday };
  }, []);

  const calendar = useCalendarEventsQuery(days.todayKey, days.tomorrowKey);
  const checkIns = useDailyCheckInsQuery({
    page: 1,
    limit: 50,
    startDate: days.monday.toISOString(),
    endDate: days.sunday.toISOString(),
  });
  const anyAppointment = useAppointmentsQuery("", 1, 1);
  const notifications = useNotificationsQuery(1, 20);

  const meds = useMemo(() => {
    const events = calendar.data ? mapCalendarApiToEvents(calendar.data) : [];
    const pick = (key: string) =>
      filterEventsForDates(events, [key])
        .filter((e): e is MedicationEvent => e.type === "medication")
        .sort((a, b) => a.intakeTime.localeCompare(b.intakeTime));
    return { today: pick(days.todayKey), tomorrow: pick(days.tomorrowKey) };
  }, [calendar.data, days]);

  const doses = useMemo(() => {
    const states = meds.today.map((e) => ({ event: e, kind: doseStateForEvent(e).kind }));
    const open = states.filter((s) => s.kind === "pending" || s.kind === "later");
    return { taken: states.filter((s) => s.kind === "taken").length, open };
  }, [meds.today]);

  const week = useMemo<StreakDay[]>(() => {
    const done = new Set((checkIns.data?.items ?? []).map((c) => localKey(new Date(c.recordedAt))));
    return WEEK_INITIALS.map((initial, i) => {
      const d = new Date(days.monday);
      d.setDate(days.monday.getDate() + i);
      const key = localKey(d);
      return { key, initial, done: done.has(key), isToday: key === days.todayKey };
    });
  }, [checkIns.data, days]);
  const doneToday = week.some((d) => d.isToday && d.done);

  // El punto del día se llena al instante (el check-in es optimista, §8), pero la racha solo cuenta
  // hoy cuando el servidor lo confirma: `lastInteractionDate` del perfil pasa a ser hoy.
  const streakIncludesToday = profile.data?.lastInteractionDate?.slice(0, 10) === days.todayKey;

  // Celebración solo cuando el servidor confirma un check-in hecho en esta sesión (MASTER §8).
  const [celebrateKey, setCelebrateKey] = useState(0);
  const previousConfirmed = useRef<boolean | null>(null);
  useEffect(() => {
    if (!profile.data) return;
    if (previousConfirmed.current === false && streakIncludesToday) setCelebrateKey((k) => k + 1);
    previousConfirmed.current = streakIncludesToday;
  }, [streakIncludesToday, profile.data]);

  const todayAppointments = dash.upcomingAppts.filter((a) => a.date?.slice(0, 10) === days.todayKey);
  const pendingCount = doses.open.length + todayAppointments.length + (doneToday ? 0 : 1);

  const setupState: SetupState = {
    medication: typeof dash.medTotal === "number" && dash.medTotal > 0,
    appointment: (anyAppointment.data?.total ?? 0) > 0,
    document: typeof dash.docTotal === "number" && dash.docTotal > 0,
  };
  const setupKnown =
    !setup.isLoading && !anyAppointment.isLoading && typeof dash.medTotal === "number" && typeof dash.docTotal === "number";
  const showSetup = setupKnown && !setup.hidden && !(setupState.medication && setupState.appointment && setupState.document);

  const greeting = useMemo((): { pose: MascotPose; title: string; message: string } => {
    const name = dash.userFirstName;
    const hello = name ? `¡Hola, ${name}!` : "¡Hola!";
    if (showSetup) return { pose: "wave", title: hello, message: "Empecemos por lo que más te sirve." };

    const allDone = doses.open.length === 0 && doneToday && todayAppointments.length === 0;
    if (allDone) {
      const tookPart = meds.today.length > 0
        ? `Tomaste ${plural(meds.today.length, "tu medicamento", `tus ${meds.today.length} medicamentos`)} e hiciste tu check-in.`
        : "Hiciste tu check-in.";
      const nextDose = meds.tomorrow[0];
      const nextAppt = dash.upcomingAppts[0];
      const next = nextDose
        ? ` Mañana ${atClock(nextDose.intakeTime)} sigue ${nextDose.data.name.trim()}.`
        : nextAppt
          ? ` Lo próximo: ${nextAppt.name || nextAppt.specialty || "tu cita"}, ${formatShortDay(nextAppt.date)}.`
          : "";
      return { pose: "joy", title: "¡Todo al día!", message: sentence(tookPart + next) };
    }

    const left = `${pendingCount} ${plural(pendingCount, "cosa", "cosas")}`;
    if (celebrateKey > 0 && doneToday) {
      return { pose: "joy", title: "¡Así se hace!", message: `Check-in listo. ${pendingCount === 1 ? "Queda 1 cosa" : `Quedan ${left}`} para hoy.` };
    }
    const nextDose = doses.open[0]?.event;
    const next = nextDose
      ? `tu ${nextDose.data.name.trim()} ${atClock(nextDose.intakeTime)}`
      : todayAppointments[0]
        ? `tu cita de ${todayAppointments[0].name || todayAppointments[0].specialty || "hoy"}`
        : "tu check-in de hoy";
    return { pose: "wave", title: hello, message: sentence(`Tienes ${left} para hoy. Lo siguiente: ${next}`) };
  }, [dash.userFirstName, dash.upcomingAppts, showSetup, doses.open, doneToday, todayAppointments, meds, pendingCount, celebrateKey]);

  const unread = (notifications.data?.items ?? []).filter((n) => !n.isRead).length;

  const greetingLoading = calendar.isLoading || checkIns.isLoading || !setupKnown || profile.isLoading;

  return {
    // Mientras carga, saludo neutro: el título y la pose no cambian a «¡Todo al día!» antes de saber
    // si es el primer uso.
    greeting: greetingLoading
      ? { pose: "wave" as MascotPose, title: dash.userFirstName ? `¡Hola, ${dash.userFirstName}!` : "¡Hola!", message: "", loading: true }
      : { ...greeting, loading: false },
    unread,
    todayMeds: meds.today,
    takenCount: doses.taken,
    streak: {
      current: profile.data?.currentStreak ?? 0,
      longest: profile.data?.longestStreak ?? 0,
      confirmedToday: streakIncludesToday,
    },
    week,
    doneToday,
    celebrateKey,
    upcomingAppointments: dash.upcomingAppts,
    recentDocuments: dash.recentDocs,
    showSetup,
    setupKnown,
    setupState,
    hideSetup: setup.hide,
    loading: {
      meds: calendar.isLoading,
      streak: checkIns.isLoading || profile.isLoading,
      appointments: dash.isApptsLoading,
      documents: dash.isDocsLoading,
    },
    refetch: () => Promise.all([dash.refetch(), calendar.refetch(), checkIns.refetch(), profile.refetch()]),
    /** Newest arrival among Inicio's queries, shown while pulling (the dashboard hook does not expose its own). */
    updatedAt: Math.max(calendar.dataUpdatedAt, checkIns.dataUpdatedAt, profile.dataUpdatedAt) || undefined,
  };
}
