import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, Check } from "lucide-react-native";
import {
  useMissionSessionAttendanceMutation,
  useScheduleMissionSessionMutation,
  type Mission,
} from "@helu/api";
import { useAppointmentByIdQuery } from "@helu/api/hooks";
import { Button, DatePicker, TextField, TimePicker, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { notify } from "../../lib/notify";
import { MascotHint } from "../brand/MascotHint";
import { useIsOnline } from "../states/OfflineBanner";
import { SessionsList } from "./SessionsList";
import { capitalize, relativeDay, timeLabel } from "./missionCopy";

const OFFLINE = { tone: "warning" as const, message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." };

/**
 * Paso de ciclo «Sesiones» (DU-30; mockups «Sesiones · …»). Una sola hoja que cambia según la fase que
 * calcula el backend: programar, próxima agendada, ¿asististe? y ¿terminaste? Cada sesión es una cita de
 * la misión; una asistencia repetida cuenta una vez (RF-39). Programar y confirmar esperan al servidor,
 * porque cambian el conteo.
 */
export function SessionsBody({
  mission,
  onDone,
  onFinish,
  onMoreSessions,
  onOpenAppointment,
}: {
  mission: Mission;
  /** Close the sheet after a saved change. */
  onDone: (message: string) => void;
  /** «Sí, terminé»: completes the sessions step. */
  onFinish: () => void;
  /** «Me ordenaron más sesiones»: opens the sessions count. */
  onMoreSessions: () => void;
  /** A row of «Tus sesiones» opens its appointment. */
  onOpenAppointment: (appointmentId: string) => void;
}) {
  const t = useAppTheme();
  const online = useIsOnline();
  const sessions = mission.sessions;
  const next = sessions?.next ?? null;
  const phase = sessions?.phase ?? "schedule";
  const appointment = useAppointmentByIdQuery(next?.appointmentId ?? "");
  const schedule = useScheduleMissionSessionMutation();
  const attendance = useMissionSessionAttendanceMutation();
  const [rescheduling, setRescheduling] = useState(false);
  const [dateKey, setDateKey] = useState("");
  const [timeKey, setTimeKey] = useState("");
  const [place, setPlace] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // «Tus sesiones» under the phase's action (mockup v2.29 · A). The upcoming one is already shown above.
  const list = (
    <SessionsList
      items={sessions?.items ?? []}
      nextId={phase === "upcoming" || phase === "confirm_attendance" ? next?.appointmentId : null}
      onOpen={onOpenAppointment}
    />
  );

  const fail = () => notify({ tone: "error", message: "No se pudo guardar", description: "Inténtalo de nuevo." });
  const whenIso = next ? `${next.date}T${(next.time ?? "00:00").slice(0, 5)}` : null;
  const where = appointment.data ? [appointment.data.clinic, appointment.data.location].filter(Boolean).join(" · ") : "";
  const whenLine = whenIso ? [`${capitalize(relativeDay(whenIso))} · ${timeLabel(whenIso)}`, where].filter(Boolean).join(" · ") : "";

  const dateFields = (labels: { date: string; time: string }) => (
    <>
      <DatePicker
        label={labels.date}
        value={dateKey}
        onChange={setDateKey}
        placeholder="Elige la fecha"
        required
        error={submitted && !dateKey ? "Elige la fecha." : undefined}
      />
      <TimePicker
        label={labels.time}
        value={timeKey}
        onChange={setTimeKey}
        placeholder="Elige la hora"
        required
        error={submitted && !timeKey ? "Elige la hora." : undefined}
      />
    </>
  );

  const valid = () => {
    setSubmitted(true);
    if (!dateKey || !timeKey) return false;
    if (!online) {
      notify(OFFLINE);
      return false;
    }
    return true;
  };

  const markAttendance = (payload: { attended: boolean; newDate?: string; newTime?: string }, message: string) => {
    if (!next) return;
    if (!online) return notify(OFFLINE);
    attendance.mutate(
      { missionId: mission.id, appointmentId: next.appointmentId, payload },
      { onSuccess: () => onDone(message), onError: fail },
    );
  };

  // «Programar»: the next session becomes an appointment of the mission.
  if (phase === "schedule") {
    return (
      <View style={styles.body}>
        <TextField label="Lugar (opcional)" value={place} onChange={setPlace} placeholder="Ej: Centro Movimiento" autoCorrect={false} />
        {dateFields({ date: "Fecha", time: "Hora" })}
        <Button
          variant="primary"
          fullWidth
          loading={schedule.isPending}
          loadingLabel="Programando…"
          onPress={() => {
            if (!valid()) return;
            schedule.mutate(
              { missionId: mission.id, payload: { date: dateKey, time: `${timeKey}:00`, clinic: place.trim() || undefined } },
              { onSuccess: () => onDone("Sesión programada"), onError: fail },
            );
          }}
        >
          Programar sesión
        </Button>
        <Text style={[styles.meta, { color: t.text.secondary }]}>Queda en tu Agenda.</Text>
        {list}
      </View>
    );
  }

  if (phase === "finish") {
    return (
      <View style={styles.body}>
        <Text style={[styles.text, { color: t.text.primary }]}>
          {`Asististe a ${sessions?.attended ?? 0} sesiones. Si te dieron de alta, cerramos este paso.`}
        </Text>
        <Button
          variant="primary"
          fullWidth
          icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
          onPress={onFinish}
        >
          Sí, terminé
        </Button>
        <Button variant="ghost" fullWidth onPress={onMoreSessions}>
          Me ordenaron más sesiones
        </Button>
        {list}
      </View>
    );
  }

  // Upcoming or past without an answer: reschedule form shared by both.
  if (rescheduling) {
    return (
      <View style={styles.body}>
        {dateFields({ date: "Nueva fecha", time: "Nueva hora" })}
        <Button
          variant="primary"
          fullWidth
          loading={attendance.isPending}
          loadingLabel="Guardando…"
          onPress={() => {
            if (!valid()) return;
            markAttendance({ attended: false, newDate: dateKey, newTime: `${timeKey}:00` }, "Sesión reprogramada");
          }}
        >
          Reprogramar
        </Button>
        {phase === "confirm_attendance" ? (
          <Button variant="ghost" fullWidth onPress={() => markAttendance({ attended: false }, "Listo, no cuenta")}>
            No la reprogramo ahora
          </Button>
        ) : null}
      </View>
    );
  }

  if (phase === "confirm_attendance") {
    return (
      <View style={styles.body}>
        {whenLine ? <Text style={[styles.text, { color: t.text.secondary }]}>{whenLine}</Text> : null}
        <Button
          variant="primary"
          fullWidth
          loading={attendance.isPending}
          loadingLabel="Guardando…"
          icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
          onPress={() => markAttendance({ attended: true }, "¡Sesión contada!")}
        >
          Sí, asistí
        </Button>
        <Button variant="ghost" fullWidth onPress={() => setRescheduling(true)}>
          No pude, reprogramar
        </Button>
        <MascotHint pose="happy" text="Solo cuenta si nos confirmas que fuiste." />
        {list}
      </View>
    );
  }

  // upcoming
  return (
    <View style={styles.body}>
      {whenLine ? (
        <View style={[styles.when, { backgroundColor: t.surface.muted, borderColor: t.border.default }]}>
          <CalendarDays size={18} strokeWidth={2.2} color={t.text.secondary} />
          <Text style={[styles.text, { color: t.text.primary, flex: 1 }]}>{whenLine}</Text>
        </View>
      ) : null}
      <Button
        variant="secondary"
        fullWidth
        icon={<CalendarDays size={16} strokeWidth={2.4} color={t.brand.solid} />}
        onPress={() => setRescheduling(true)}
      >
        Reprogramar
      </Button>
      {list}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  text: { fontSize: 15, lineHeight: 22, fontFamily: nativeFont("body", 400) },
  meta: { fontSize: 13, lineHeight: 18, textAlign: "center", fontFamily: nativeFont("body", 400) },
  when: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 14, borderRadius: 14, borderWidth: 1 },
});
