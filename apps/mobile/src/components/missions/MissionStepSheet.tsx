import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, Check, FilePlus, FileText, Heart, ListOrdered, Pill, Stethoscope } from "lucide-react-native";
import type { Mission, MissionStep } from "@helu/api";
import { BottomSheet, Button, IconTile, nativeFont, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";
import { MascotHint } from "../brand/MascotHint";
import { notify } from "../../lib/notify";
import { ReceiptBody } from "./ReceiptBody";
import { SessionsBody } from "./SessionsBody";
import { SessionsCountBody } from "./SessionsCountBody";
import { capitalize, relativeDay, sessionMessage, shortDate, stepLabel, timeLabel } from "./missionCopy";

export interface StepSheetActions {
  complete: (step: MissionStep, data?: Record<string, unknown>) => void;
  skip: (step: MissionStep, reason: "not_applicable" | "no_authorization_needed" | "nothing_to_save") => void;
  /** Open the appointment form linked to this mission. */
  schedule: () => void;
  /** Open an appointment of the mission (a session from «Tus sesiones»). */
  openAppointment: (appointmentId: string) => void;
}

/**
 * Hoja del paso (v2.16: el paso se toca y abre su hoja; mockups «Paso 1–4», «Cita · ¿Pudiste asistir?»,
 * «Paso final», «Paso ya completado»). Una acción primaria y como máximo una secundaria, apiladas.
 * Las acciones rápidas cierran la hoja y el paso cambia al tocar (DU-6); el paso final espera al
 * servidor, porque cierra la misión.
 */
export function MissionStepSheet({
  mission,
  step,
  onClose,
  actions,
  closing,
}: {
  mission: Mission;
  step: MissionStep;
  onClose: () => void;
  actions: StepSheetActions;
  /** The final step is waiting for the server. */
  closing?: boolean;
}) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  // «Me ordenaron más sesiones» swaps the sessions sheet for the count (DU-30).
  const [countMode, setCountMode] = useState(false);
  // «Recibí una parte» asks what is pending in the same sheet (mockup «Recepción parcial»).
  const [receiptPartial, setReceiptPartial] = useState(false);
  const position = mission.steps.filter((s) => s.applies).findIndex((s) => s.key === step.key) + 1;
  const total = mission.steps.filter((s) => s.applies).length;
  const done = step.status === "completed" || step.status === "skipped";
  const isFinal = position === total;
  const appt = mission.appointment;
  const when = appt ? `${capitalize(relativeDay(`${appt.date}T${appt.time}`))} · ${timeLabel(`${appt.date}T${appt.time}`)}` : null;
  const place = appt ? [appt.clinic, appt.location].filter(Boolean).join(" · ") : "";

  /** Quick actions close the sheet first, then the step moves (optimistic). */
  const thenClose = (fn: () => void) => () => ref.current?.close(fn);

  const sessions = mission.sessions;
  const isSessions = step.key === "sessions" && !done && !countMode;
  const isCount = step.key === "sessions_count" || (step.key === "sessions" && countMode);
  const countStep = mission.steps.find((s) => s.key === "sessions_count");
  const title = isSessions
    ? sessionMessage(sessions)
    : isCount
      ? "¿Cuántas sesiones te ordenaron?"
      : receiptPartial
        ? "¿Qué quedó pendiente?"
        : stepLabel[step.key] ?? step.key;
  const eyebrow = isSessions && sessions?.total
    ? `SESIONES · ${sessions.attended} DE ${sessions.total}`
    : receiptPartial
      ? "RECEPCIÓN PARCIAL"
    : done && !isCount
      ? `PASO ${position} DE ${total} · ${step.status === "skipped" ? "NO APLICA" : "COMPLETADO"}`
      : `PASO ${position} DE ${total}`;
  const icon = (
    <IconTile
      round
      size="lg"
      tone={done && !isCount ? "success" : "brand"}
      icon={iconFor(isCount ? "sessions_count" : step.key, done && !isCount ? t.status.successFg : t.brand.text)}
    />
  );

  return (
    <BottomSheet ref={ref} title={title} eyebrow={eyebrow} icon={icon} onClose={onClose}>
      <View style={styles.body}>
        {isCount && countStep ? (
          <SessionsCountBody
            mission={mission}
            onSave={(value) => ref.current?.close(() => actions.complete(countStep, { total: value }))}
          />
        ) : isSessions ? (
          <SessionsBody
            mission={mission}
            onDone={(message) => ref.current?.close(() => notify({ message }))}
            onFinish={thenClose(() => actions.complete(step, { finished: true }))}
            onMoreSessions={() => setCountMode(true)}
            onOpenAppointment={(id) => ref.current?.close(() => actions.openAppointment(id))}
          />
        ) : done ? (
          <>
            <Text style={[styles.text, { color: t.text.primary }]}>
              {step.status === "skipped" ? "Marcaste este paso como «No aplica»." : `Completado el ${shortDate(step.completedAt)}.`}
              {step.completedBy?.name && step.completedBy.id !== mission.userId ? ` Lo marcó ${step.completedBy.name}.` : ""}
            </Text>
            <Button variant="secondary" fullWidth onPress={() => ref.current?.close()}>
              Cerrar
            </Button>
          </>
        ) : step.key === "get_appointment" || step.key === "schedule" ? (
          <>
            <Text style={[styles.text, { color: t.text.primary }]}>
              {mission.type === "medical_exam"
                ? "Registra dónde y cuándo te harás el examen."
                : "Registra dónde y cuándo es tu cita."}
            </Text>
            <Button variant="primary" fullWidth onPress={thenClose(actions.schedule)}>
              {mission.type === "medical_exam" ? "Programar el examen" : "Programar la cita"}
            </Button>
            <MascotHint
              pose="happy"
              text={
                mission.type === "medical_exam"
                  ? "Si ya está agendado, este paso queda listo al registrarlo."
                  : "Si ya está agendada, este paso queda listo al registrarla."
              }
            />
          </>
        ) : step.key === "attend" || step.key === "perform" ? (
          <>
            {/* The sheet title already asks the question; the body says when and where. */}
            {when ? <Text style={[styles.text, { color: t.text.secondary }]}>{[when, place].filter(Boolean).join(" · ")}</Text> : null}
            <Button
              variant="primary"
              fullWidth
              icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
              onPress={thenClose(() => actions.complete(step, { attended: true }))}
            >
              {step.key === "attend" ? "Sí, asistí" : "Sí, me lo hice"}
            </Button>
            <Button variant="ghost" fullWidth onPress={thenClose(() => actions.complete(step, { attended: false }))}>
              {step.key === "attend" ? "No pude asistir" : "No pude, reprogramar"}
            </Button>
            <MascotHint pose="happy" text="No lo marcamos solos aunque haya pasado la hora." />
          </>
        ) : isFinal ? (
          <>
            <Text style={[styles.text, { color: t.text.primary }]}>
              {step.key === "results"
                ? "La misión termina cuando confirmas que tienes los resultados. Subirlos es opcional."
                : "Ya cumpliste el objetivo. Los documentos de tu consulta siguen en Documentos."}
            </Text>
            <Button
              variant="success"
              fullWidth
              loading={closing}
              loadingLabel="Terminando…"
              icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
              onPress={() => actions.complete(step)}
            >
              {step.key === "results" ? "Ya tengo los resultados" : "Terminar la misión"}
            </Button>
          </>
        ) : step.key === "receipt" ? (
          <ReceiptBody
            mission={mission}
            step={step}
            onPartialChange={setReceiptPartial}
            onSave={(data) => ref.current?.close(() => actions.complete(step, data))}
          />
        ) : (
          <>
            <Text style={[styles.text, { color: t.text.primary }]}>
              {step.key === "prepare"
                ? "Adjunta lo que necesites llevar. Los documentos no son obligatorios."
                : "Márcalo cuando lo hayas hecho."}
            </Text>
            {step.key === "prepare" && mission.type === "medical_exam" ? (
              <Text style={[styles.meta, { color: t.text.secondary }]}>Sin indicaciones de preparación registradas para este examen.</Text>
            ) : null}
            <Button variant="primary" fullWidth onPress={thenClose(() => actions.complete(step))}>
              {step.key === "prepare" ? "Ya estoy listo" : "Listo"}
            </Button>
            {step.required ? null : (
              <Button variant="ghost" fullWidth onPress={thenClose(() => actions.skip(step, "not_applicable"))}>
                No aplica
              </Button>
            )}
          </>
        )}
      </View>
    </BottomSheet>
  );
}

function iconFor(key: string, color: string) {
  const p = { size: 22, strokeWidth: 2.2, color };
  if (key === "get_appointment" || key === "schedule") return <CalendarDays {...p} />;
  if (key === "attend") return <Stethoscope {...p} />;
  if (key === "receipt" || key === "claim") return <Pill {...p} />;
  if (key === "sessions") return <Heart {...p} />;
  if (key === "sessions_count") return <ListOrdered {...p} />;
  if (key === "final_documents" || key === "results") return <FilePlus {...p} />;
  return <FileText {...p} />;
}

const styles = StyleSheet.create({
  body: { gap: spacing[3], paddingBottom: spacing[2] },
  text: { fontSize: 15, lineHeight: 22, fontFamily: nativeFont("body", 400) },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
});
