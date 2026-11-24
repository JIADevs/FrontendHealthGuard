import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, Check, FilePlus, FileText, Heart, ListOrdered, Pill, Plus, Stethoscope } from "lucide-react-native";
import type { Mission, MissionStep } from "@helu/api";
import { BottomSheet, Button, IconTile, nativeFont, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";
import { MascotHint } from "../brand/MascotHint";
import { MissionLink } from "./MissionLink";
import { notify } from "../../lib/notify";
import { ReceiptBody } from "./ReceiptBody";
import { SessionsBody } from "./SessionsBody";
import { SessionsCountBody } from "./SessionsCountBody";
import { capitalize, relativeDay, sessionMessage, shortDate, stepTitle, timeLabel } from "./missionCopy";

export interface StepSheetActions {
  complete: (step: MissionStep, data?: Record<string, unknown>) => void;
  skip: (step: MissionStep, reason: "not_applicable" | "no_authorization_needed" | "nothing_to_save") => void;
  /** Open the appointment form linked to this mission. */
  schedule: () => void;
  /** Open an appointment of the mission (a session from «Tus sesiones»). */
  openAppointment: (appointmentId: string) => void;
  /** «Agregarlo a tus medicamentos»: open the medication form; saving completes the step (RF-25). */
  addMedication: () => void;
  /** «Adjuntar documento» from this step (RF-60); the sheet comes back after attaching. */
  attach: (step: MissionStep) => void;
}

/** What each type usually keeps in its final step (RF-42). */
const FINAL_COPY: Record<Mission["type"], string> = {
  medical_appointment: "Guarda la fórmula, las órdenes o el resumen de tu consulta. Quedan en tu cita y en Documentos.",
  medical_exam: "La misión termina cuando confirmas que tienes los resultados. Subirlos es opcional.",
  medication: "Guarda la fórmula o el comprobante de entrega. Es opcional.",
  therapy: "Guarda el informe de cierre de tu terapia. Es opcional.",
};

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
  stepDocuments = [],
}: {
  mission: Mission;
  step: MissionStep;
  onClose: () => void;
  actions: StepSheetActions;
  /** The final step is waiting for the server. */
  closing?: boolean;
  /** Documents attached from this step, shown in the step. */
  stepDocuments?: { id: string; title: string }[];
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
        : stepTitle(mission, step.key);
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
            {/* RF-42 / DU-16: save or skip the final documents; closing waits for the server. */}
            <Text style={[styles.text, { color: t.text.primary }]}>{FINAL_COPY[mission.type]}</Text>
            <StepDocuments docs={stepDocuments} />
            {stepDocuments.length > 0 ? (
              <>
                <Button
                  variant="success"
                  fullWidth
                  loading={closing}
                  loadingLabel="Terminando…"
                  icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
                  onPress={() => actions.complete(step)}
                >
                  Guardar y terminar
                </Button>
                <Button variant="ghost" fullWidth disabled={closing} onPress={thenClose(() => actions.attach(step))}>
                  Adjuntar otro documento
                </Button>
              </>
            ) : step.key === "results" ? (
              <>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={closing}
                  icon={<FilePlus size={17} strokeWidth={2.4} color={t.text.onSolid} />}
                  onPress={thenClose(() => actions.attach(step))}
                >
                  Subir resultados
                </Button>
                {/* DU-20: «Ya tengo los resultados» closes without uploading. */}
                <Button variant="ghost" fullWidth loading={closing} loadingLabel="Terminando…" onPress={() => actions.complete(step)}>
                  Ya tengo los resultados
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={closing}
                  icon={<FilePlus size={17} strokeWidth={2.4} color={t.text.onSolid} />}
                  onPress={thenClose(() => actions.attach(step))}
                >
                  Adjuntar documentos
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  loading={closing}
                  loadingLabel="Terminando…"
                  onPress={() => actions.skip(step, "nothing_to_save")}
                >
                  Omitir, no me dieron nada
                </Button>
              </>
            )}
          </>
        ) : step.key === "authorization" ? (
          <>
            {/* DU-41: the authorization document goes in this step; skipping is «No necesito autorización». */}
            <Text style={[styles.text, { color: t.text.primary }]}>
              Si tu EPS te dio una autorización, súbela aquí para tenerla a mano. Es opcional.
            </Text>
            <StepDocuments docs={stepDocuments} />
            <MissionLink
              center
              icon={<Plus size={15} strokeWidth={2.6} color={t.brand.text} />}
              label={stepDocuments.length > 0 ? "Adjuntar otro documento" : "Subir la autorización"}
              onPress={thenClose(() => actions.attach(step))}
            />
            <Button
              variant="primary"
              fullWidth
              onPress={thenClose(() => actions.complete(step, { status: "authorized" }))}
            >
              {stepDocuments.length > 0 ? "Guardar autorización" : "Ya tengo la autorización"}
            </Button>
            <Button variant="ghost" fullWidth onPress={thenClose(() => actions.skip(step, "no_authorization_needed"))}>
              No necesito autorización
            </Button>
          </>
        ) : step.key === "add_to_app" ? (
          <>
            <Text style={[styles.text, { color: t.text.primary }]}>
              Agrégalo a tus medicamentos y te avisamos en cada toma. El paso queda listo al guardarlo.
            </Text>
            <Button
              variant="primary"
              fullWidth
              icon={<Pill size={17} strokeWidth={2.4} color={t.text.onSolid} />}
              onPress={thenClose(actions.addMedication)}
            >
              Agregar medicamento
            </Button>
            <Button variant="ghost" fullWidth onPress={thenClose(() => actions.skip(step, "not_applicable"))}>
              No aplica
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
            {step.key === "prepare" ? (
              <>
                <StepDocuments docs={stepDocuments} />
                {/* «Adjuntar documento» is a permanent secondary action (misiones.md, RF-60). */}
                <MissionLink
                  center
                  icon={<Plus size={15} strokeWidth={2.6} color={t.brand.text} />}
                  label="Adjuntar documento"
                  onPress={thenClose(() => actions.attach(step))}
                />
              </>
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

/** Documents already attached from this step: a quiet list, the card in the detail has the actions. */
function StepDocuments({ docs }: { docs: { id: string; title: string }[] }) {
  const t = useAppTheme();
  if (docs.length === 0) return null;
  return (
    <View style={[styles.docs, { backgroundColor: t.surface.muted }]}>
      {docs.map((d) => (
        <View key={d.id} style={styles.docRow}>
          <FileText size={15} strokeWidth={2.2} color={t.accent.docFg} />
          <Text style={[styles.meta, { color: t.text.primary, flex: 1 }]} numberOfLines={1}>
            {d.title}
          </Text>
        </View>
      ))}
    </View>
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
  docs: { gap: 6, padding: spacing[3], borderRadius: 12 },
  docRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
});
