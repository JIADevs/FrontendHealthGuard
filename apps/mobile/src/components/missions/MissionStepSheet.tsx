import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, Check, FilePlus, FileText, Heart, ListOrdered, Pill, Plus, Stethoscope, Upload } from "lucide-react-native";
import type { Mission, MissionStep } from "@helu/api";
import { BottomSheet, Button, IconTile, nativeFont, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";
import { MascotHint } from "../brand/MascotHint";
import { MissionLink } from "./MissionLink";
import { notify } from "../../lib/notify";
import { ReceiptBody } from "./ReceiptBody";
import { SessionsBody } from "./SessionsBody";
import { SessionsCountBody } from "./SessionsCountBody";
import { StepReminders } from "./StepReminders";
import { capitalize, relativeDay, sessionMessage, shortDate, stepTitle, timeLabel } from "./missionCopy";

export interface StepSheetActions {
  complete: (step: MissionStep, data?: Record<string, unknown>) => void;
  skip: (step: MissionStep, reason: NonNullable<MissionStep["skipReason"]>) => void;
  /** Open the appointment form linked to this mission. */
  schedule: () => void;
  /** Open an appointment of the mission (a session from «Tus sesiones»). */
  openAppointment: (appointmentId: string) => void;
  /** «Agregarlo a tus medicamentos»: open the medication form; saving completes the step (RF-25). */
  addMedication: () => void;
  /** «Adjuntar documento» from this step (RF-60); the sheet comes back after attaching. */
  attach: (step: MissionStep) => void;
  /** «Crear recordatorio»: a support task in Agenda for this step (RF-27); the sheet comes back. */
  addReminder: (step: MissionStep) => void;
  /** «Cambiar»: attach another document; it takes the place of `documentId` in this step. */
  replace: (step: MissionStep, documentId: string) => void;
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
  stepDocuments = [],
}: {
  mission: Mission;
  step: MissionStep;
  onClose: () => void;
  actions: StepSheetActions;
  /** The final step is waiting for the server. */
  closing?: boolean;
  /** Documents attached from this step, shown in the step. */
  stepDocuments?: { id: string; title: string; uploadedAt?: string | null }[];
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
        : stepTitle(mission, step.key, step.sheet.type !== "custom");
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
        ) : step.sheet.type === "yes_no" ? (
          // RF-100: «¿Pudiste…?» drawn only from the step data (attend, perform or a new step).
          <YesNoBody step={step} detail={when ? [when, place].filter(Boolean).join(" · ") : null} actions={actions} thenClose={thenClose} />
        ) : step.sheet.type === "attach" ? (
          // RF-100: «adjuntar documento» drawn only from the step data (authorization, prepare, results,
          // final documents or a new step such as an order).
          <AttachBody mission={mission} step={step} docs={stepDocuments} closing={closing} actions={actions} thenClose={thenClose} />
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
          // A `custom` step this app does not know (RF-100): its backend label and hint, «Listo», and
          // «No aplica» when it can be skipped. Never the raw key.
          <>
            <Text style={[styles.text, { color: t.text.primary }]}>{step.hint ?? "Márcalo cuando lo hayas hecho."}</Text>
            {step.final ? (
              <Button variant="success" fullWidth loading={closing} loadingLabel="Terminando…" onPress={() => actions.complete(step)}>
                Listo
              </Button>
            ) : (
              <Button variant="primary" fullWidth onPress={thenClose(() => actions.complete(step))}>
                Listo
              </Button>
            )}
            {step.canSkip || !step.required ? (
              <Button variant="ghost" fullWidth disabled={closing} onPress={thenClose(() => actions.skip(step, "not_applicable"))}>
                No aplica
              </Button>
            ) : null}
          </>
        )}
      </View>
    </BottomSheet>
  );
}

type ThenClose = (fn: () => void) => () => void;

/**
 * «¿Pudiste…?» (RF-100, `yes_no`): the title asks; the body says when and where. «Sí» and «No» send
 * the answer under `answerKey`; the backend decides what each does (DA-12).
 */
function YesNoBody({
  step,
  detail,
  actions,
  thenClose,
}: {
  step: MissionStep;
  detail: string | null;
  actions: StepSheetActions;
  thenClose: ThenClose;
}) {
  const t = useAppTheme();
  const sheet = step.sheet;
  const key = sheet.answerKey ?? "answer";
  return (
    <>
      {detail ? <Text style={[styles.text, { color: t.text.secondary }]}>{detail}</Text> : null}
      {sheet.body ? <Text style={[styles.text, { color: t.text.primary }]}>{sheet.body}</Text> : null}
      <Button
        variant="primary"
        fullWidth
        icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
        onPress={thenClose(() => actions.complete(step, { [key]: true }))}
      >
        {sheet.primaryLabel ?? "Sí"}
      </Button>
      <Button variant="ghost" fullWidth onPress={thenClose(() => actions.complete(step, { [key]: false }))}>
        {sheet.secondaryLabel ?? "No"}
      </Button>
      {sheet.note ? <MascotHint pose="happy" text={sheet.note} /> : null}
    </>
  );
}

/**
 * «Adjuntar documento» (RF-100, `attach`; mockups «Paso 2 · Prepararte», «4b · Autorización», «Paso
 * final»). One primary and at most one secondary:
 * - without a document and `primaryNeedsDocument`, attaching is the primary (B2);
 * - otherwise the primary completes the step (`completeData`); a final step waits for the server,
 *   because it closes the mission (DU-17);
 * - the secondary skips (`skipReason`) or completes without a document («Ya tengo los resultados»,
 *   DU-20); a final step with documents offers «Adjuntar otro documento» instead.
 * A step that completes without a document keeps «Adjuntar documento» as a permanent link and its
 * support reminders (RF-60, RF-27).
 */
function AttachBody({
  mission,
  step,
  docs,
  closing,
  actions,
  thenClose,
}: {
  mission: Mission;
  step: MissionStep;
  docs: { id: string; title: string; uploadedAt?: string | null }[];
  closing?: boolean;
  actions: StepSheetActions;
  thenClose: ThenClose;
}) {
  const t = useAppTheme();
  const sheet = step.sheet;
  const hasDocs = docs.length > 0;
  const attachFirst = sheet.primaryNeedsDocument && !hasDocs;
  const optionalDocument = !sheet.primaryNeedsDocument;
  const data = sheet.completeData ?? undefined;
  // The final step waits for the server (it closes the mission); the others close the sheet first.
  const complete = step.final ? () => actions.complete(step, data) : thenClose(() => actions.complete(step, data));
  const attach = thenClose(() => actions.attach(step));
  const secondary =
    step.final && hasDocs
      ? { label: "Adjuntar otro documento", onPress: attach, waits: false }
      : sheet.secondaryAction === "skip" && sheet.secondaryLabel
        ? {
            label: sheet.secondaryLabel,
            onPress: step.final
              ? () => actions.skip(step, sheet.skipReason ?? "not_applicable")
              : thenClose(() => actions.skip(step, sheet.skipReason ?? "not_applicable")),
            waits: step.final,
          }
        : sheet.secondaryAction === "complete" && sheet.secondaryLabel && !hasDocs
          ? { label: sheet.secondaryLabel, onPress: complete, waits: step.final }
          : null;

  return (
    <>
      {sheet.body ? <Text style={[styles.text, { color: t.text.primary }]}>{sheet.body}</Text> : null}
      {sheet.primaryNeedsDocument && !step.final ? (
        docs.map((d) => <AttachedDocument key={d.id} doc={d} onChange={thenClose(() => actions.replace(step, d.id))} />)
      ) : (
        <StepDocuments docs={docs} />
      )}
      {optionalDocument && !step.final ? (
        <>
          {/* «Adjuntar documento» is a permanent secondary action (misiones.md, RF-60). */}
          <MissionLink
            center
            icon={<Plus size={15} strokeWidth={2.6} color={t.brand.text} />}
            label={sheet.attachLabel ?? "Adjuntar documento"}
            onPress={attach}
          />
          {/* RF-27 / DA-10: support tasks, as in the mockup «Paso con tarea de apoyo». */}
          <StepReminders mission={mission} step={step} onCreate={thenClose(() => actions.addReminder(step))} />
        </>
      ) : null}
      {attachFirst ? (
        <Button
          variant="primary"
          fullWidth
          disabled={closing}
          icon={<Upload size={17} strokeWidth={2.4} color={t.text.onSolid} />}
          onPress={attach}
        >
          {sheet.attachLabel ?? "Adjuntar documento"}
        </Button>
      ) : step.final ? (
        <Button
          variant="success"
          fullWidth
          loading={closing}
          loadingLabel="Terminando…"
          icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
          onPress={complete}
        >
          {sheet.primaryLabel ?? "Guardar y terminar"}
        </Button>
      ) : (
        <Button variant="primary" fullWidth onPress={complete}>
          {sheet.primaryLabel ?? "Listo"}
        </Button>
      )}
      {secondary ? (
        <Button
          variant="ghost"
          fullWidth
          loading={secondary.waits ? closing : undefined}
          loadingLabel="Terminando…"
          disabled={!secondary.waits && closing}
          onPress={secondary.onPress}
        >
          {secondary.label}
        </Button>
      ) : null}
    </>
  );
}

/** B2 «Con el documento»: the attached document as a card, with «Cambiar» (≥ 44 px, MissionLink). */
function AttachedDocument({ doc, onChange }: { doc: { id: string; title: string; uploadedAt?: string | null }; onChange: () => void }) {
  const t = useAppTheme();
  return (
    <View style={[styles.attached, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
      <IconTile tone="document" icon={<FileText size={18} strokeWidth={2.2} color={t.accent.docFg} />} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.attachedTitle, { color: t.text.primary }]} numberOfLines={2}>
          {doc.title}
        </Text>
        {doc.uploadedAt ? <Text style={[styles.meta, { color: t.text.secondary }]}>{capitalize(shortDate(doc.uploadedAt))}</Text> : null}
      </View>
      <MissionLink label="Cambiar" onPress={onChange} />
    </View>
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
  body: { gap: spacing[3] },
  attached: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingLeft: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  attachedTitle: { fontSize: 15, fontFamily: nativeFont("body", 600) },
  text: { fontSize: 15, lineHeight: 22, fontFamily: nativeFont("body", 400) },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  docs: { gap: 6, padding: spacing[3], borderRadius: 12 },
  docRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
});
