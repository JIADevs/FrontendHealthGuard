import { useState, type ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import {
  useAppTheme,
  SkeletonGroup,
  Skeleton,
  useSkeletonVisible,
  contentEntering,
  spacing,
  fontSize,
  nativeFont,
  Button,
  Chip,
  DangerLink,
  ConfirmModal,
  IconButton,
  IconTile,
  formatClock,
  formatShortDay,
  type ThemeContextValue,
  type Tone,
} from "@helu/ui";
import { useCreateMissionMutation, useMissionQuery, type Appointment } from "@helu/api";
import { useQueryClient } from "@tanstack/react-query";
import { notify } from "../../lib/notify";
import {
  useAppointmentByIdQuery,
  useUpdateAppointmentStatusMutation,
  useTreatmentsByIdsQuery,
  useDocumentsByIdsQuery,
  useBackpacksByIdsQuery,
} from "@helu/api/hooks";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  Bell,
  FileText,
  Backpack,
  Activity,
  Edit,
  Check,
  Plus,
  Route,
  XCircle,
} from "lucide-react-native";

import { ScreenHeader } from "../ScreenHeader";
import { SkeletonHeaderAction } from "../SkeletonPieces";
import { MissionRow } from "../missions/MissionRow";
import { useIsOnline } from "../states/OfflineBanner";


const MODALITY_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIRTUAL: "Virtual",
  DOMICILIARIA: "Domiciliaria",
};

function reminderLine(offsets: number[] | undefined): string {
  if (!offsets || offsets.length === 0) return "Sin recordatorio";
  if (offsets.length === 1 && offsets[0] === 0) return "A la hora de la cita";
  return offsets
    .map((minutes) => {
      if (minutes >= 1440) {
        const days = Math.round(minutes / 1440);
        return days === 1 ? "1 día antes" : `${days} días antes`;
      }
      if (minutes >= 60) {
        const hours = Math.round(minutes / 60);
        return hours === 1 ? "1 hora antes" : `${hours} horas antes`;
      }
      return `${minutes} min antes`;
    })
    .join(", ");
}

/** «hoy», «mañana», «en 2 días», «ayer», «hace 3 días». */
function relativeDay(isoDate: string): string {
  const day = new Date(`${isoDate.slice(0, 10)}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((day - today) / 86_400_000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  if (diff === -1) return "ayer";
  return diff > 1 ? `en ${diff} días` : `hace ${-diff} días`;
}

const WEEKDAY_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Fila del mockup (`row`): cuadro de 40 px, título Inter 600 14, metadato 13 y algo a la derecha. */
function InfoRow({
  t,
  tone,
  icon,
  title,
  meta,
  right,
}: {
  t: ThemeContextValue;
  tone: Tone;
  icon: ReactNode;
  title: string;
  meta?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <IconTile tone={tone} icon={icon} />
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: t.text.primary }]} numberOfLines={2}>{title}</Text>
        {meta ? <Text style={[styles.rowMeta, { color: t.text.secondary }]} numberOfLines={2}>{meta}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function InlineLink({ t, label, icon, onPress }: { t: ThemeContextValue; label: string; icon?: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={styles.inlineLink}>
      {icon}
      <Text style={[styles.link, { color: t.brand.text }]}>{label}</Text>
    </Pressable>
  );
}

export interface AppointmentDetailProps {
  id: string;
  onEdit: (id: string) => void;
  /** «+ Agregar documento» */
  onAddDocument: () => void;
  /** The mission of this appointment (mockups 4c «C2», «C4»). */
  onOpenMission: (missionId: string) => void;
}

export function AppointmentDetail({ id, onEdit, onAddDocument, onOpenMission }: AppointmentDetailProps) {
  const t = useAppTheme();
  const online = useIsOnline();
  const createMission = useCreateMissionMutation();

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: appointment, isLoading } = useAppointmentByIdQuery(id);
  const showSkeleton = useSkeletonVisible(isLoading);

  const treatmentResults = useTreatmentsByIdsQuery(appointment?.treatmentIds ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treatments = treatmentResults.map((r: any) => r.data).filter(Boolean);
  const preDocResults = useDocumentsByIdsQuery(appointment?.preDocumentIds ?? []);
  const postDocResults = useDocumentsByIdsQuery(appointment?.postDocumentIds ?? []);
  const prePackResults = useBackpacksByIdsQuery(appointment?.preBackpackIds ?? []);
  const postPackResults = useBackpacksByIdsQuery(appointment?.postBackpackIds ?? []);

  const missionQuery = useMissionQuery(appointment?.missionId ?? undefined);
  const mission = missionQuery.data;

  const statusMut = useUpdateAppointmentStatusMutation();
  const qc = useQueryClient();

  // MASTER §8: cause + what to do; the server's technical message stays out of the toast.
  const showError = () =>
    notify({ tone: "error", message: "No se pudo actualizar la cita", description: "Revisa tu conexión e intenta de nuevo." });

  // «Sí, asistí» / «No pude» are low risk and reversible (movimiento §8, v2.14): the card, the chip
  // and the toast change on tap and the status saves in the background; on error it goes back and
  // the toast says so. «Cancelar cita» still waits for the server (MASTER §7: destructive).
  const setStatus = (status: "ASISTI" | "NO_ASISTI" | "CANCELADA", success: string, after?: () => void) => {
    if (status === "CANCELADA") {
      statusMut.mutate(
        { id, status },
        {
          onSuccess: () => {
            setShowCancelDialog(false);
            qc.setQueryData<Appointment>(["appointment", id], (prev) => (prev ? { ...prev, status } : prev));
            notify({ message: success });
          },
          onError: () => showError(),
        },
      );
      return;
    }
    const key = ["appointment", id] as const;
    const previous = qc.getQueryData<Appointment>(key);
    void qc.cancelQueries({ queryKey: key });
    qc.setQueryData<Appointment>(key, (prev) => (prev ? { ...prev, status } : prev));
    notify({ message: success });
    after?.();
    // mutateAsync: «No pude» opens the edit screen, and per-call callbacks of `mutate` are dropped
    // if this screen unmounts first.
    statusMut.mutateAsync({ id, status }).catch(() => {
      qc.setQueryData(key, previous);
      showError();
    });
  };

  const handleEdit = () => onEdit(id);

  // «Seguir como misión» (RF-22, DA-8, mockup «C4»): appointments saved before M6b got none on their own.
  const followAsMission = () => {
    if (!appointment) return;
    if (!online) return notify({ tone: "warning", message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." });
    const exam = appointment.type === "EXAM";
    const examName = appointment.examType || appointment.name || "Examen";
    createMission.mutate(
      {
        type: exam ? "medical_exam" : "medical_appointment",
        details: exam ? { exam_name: examName } : appointment.specialty ? { specialty: appointment.specialty } : {},
        appointmentId: appointment.id,
      },
      {
        onSuccess: (created) => {
          qc.invalidateQueries({ queryKey: ["appointment", id] });
          notify({ message: "Misión creada", description: created.title });
          onOpenMission(created.id);
        },
        onError: () => notify({ tone: "error", message: "No se pudo crear la misión", action: { label: "Reintentar", onPress: followAsMission } }),
      },
    );
  };

  if (showSkeleton) {
    // §6c «Detalle de cita»: la barra con volver se ve real; encabezado, datos y acciones son esqueleto.
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]}>
        <ScreenHeader title="Cita" right={<SkeletonHeaderAction />} />
        {/* §6c: the cards of an upcoming appointment, with their fixed titles real. */}
        <SkeletonGroup label="Cargando la cita" style={styles.content}>
          <View style={[styles.card, cardColors(t)]}>
            <View style={styles.summaryRow}>
              <Skeleton width={52} height={52} radius={16} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="45%" height={13} />
              </View>
            </View>
            <View style={styles.chips}>
              <Skeleton width={84} height={26} radius={13} />
              <Skeleton width={84} height={26} radius={13} />
              <Skeleton width={96} height={26} radius={13} />
            </View>
          </View>
          <View style={[styles.card, cardColors(t)]}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.row}>
                <Skeleton width={40} height={40} radius={13} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))}
          </View>
          <View style={[styles.card, cardColors(t)]}>
            <Text style={[styles.h3, { color: t.text.primary }]}>Documentos y mochilas</Text>
            <Text style={[styles.lbl, { color: t.text.primary }]}>Para llevar</Text>
            <Skeleton width="55%" height={13} />
            <Text style={[styles.lbl, { color: t.text.primary }]}>Obtenidos después</Text>
            <Skeleton width="45%" height={13} />
            <Skeleton width={150} height={16} />
          </View>
          <Skeleton height={48} radius={14} />
          <View style={{ alignItems: "center" }}>
            <Skeleton width={130} height={16} />
          </View>
        </SkeletonGroup>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]}>
        <ScreenHeader title="Cita" />
        <View style={styles.centered}>
          <Text style={[styles.sub, { color: t.text.secondary }]}>No encontramos esta cita. Puede que la hayan eliminado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExam = appointment.type === "EXAM";
  const title = appointment.name || appointment.specialty || (isExam ? "Examen médico" : "Cita médica");
  const who = [appointment.doctor, appointment.specialty].filter(Boolean).join(" · ");
  const date = appointment.date?.slice(0, 10) ?? "";
  const time = appointment.time?.slice(0, 5) ?? "";
  const startMs = new Date(`${date}T${time || "00:00"}`).getTime();
  const hasStarted = Number.isFinite(startMs) && startMs <= Date.now();
  const cancelled = appointment.status === "CANCELADA";
  const answered = appointment.status === "ASISTI" || appointment.status === "NO_ASISTI";
  const isVirtual = appointment.modality === "VIRTUAL";
  const address = [appointment.clinic, appointment.location].filter(Boolean).join(", ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pick = (results: any[]) => results.map((r) => r.data).filter(Boolean);
  const preDocs = pick(preDocResults);
  const postDocs = pick(postDocResults);
  const prePacks = pick(prePackResults);
  const postPacks = pick(postPackResults);

  const statusChip =
    appointment.status === "ASISTI" ? (
      <Chip label="Completada" tone="success" icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />} />
    ) : appointment.status === "NO_ASISTI" ? (
      <Chip label="No asistí" tone="neutral" />
    ) : cancelled ? (
      <Chip label="Cancelada" tone="neutral" />
    ) : (
      <Chip label="Programada" tone="brand" icon={<Clock size={12} color={t.brand.text} />} />
    );

  const grayIcon = (Icon: typeof Clock) => <Icon size={19} strokeWidth={2.2} color={t.text.muted} />;
  // A completed mission stays as it is (DU-51); only one in progress goes with the appointment.
  const cancelsMission = !!mission && (mission.status === "active" || mission.status === "paused");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]} edges={["top", "bottom"]}>
      <ScreenHeader
        title={isExam ? "Examen" : "Cita"}
        right={
          <IconButton
            icon={<Edit size={17} color={t.text.onMuted} />}
            accessibilityLabel="Editar cita"
            onPress={handleEdit}
          />
        }
      />

      <Animated.ScrollView entering={contentEntering} contentContainerStyle={styles.content}>
        {/* Resumen: cuadro grande del módulo, título H2 y chips de estado y atributos (mockup «Detalle de cita»). */}
        <View style={[styles.card, cardColors(t)]}>
          <View style={styles.summaryRow}>
            <IconTile
              tone="appointment"
              size="lg"
              icon={<CalendarDays size={24} strokeWidth={2.2} color={t.accent.calFg} />}
            />
            <View style={styles.rowCopy}>
              <Text style={[styles.h2, { color: t.text.primary }]}>{title}</Text>
              {who ? <Text style={[styles.sub, { color: t.text.secondary }]}>{who}</Text> : null}
            </View>
          </View>
          <View style={styles.chips}>
            {statusChip}
            <Chip label={MODALITY_LABELS[appointment.modality] ?? appointment.modality} tone="neutral" />
            <Chip label={isExam ? "Examen" : "Cita médica"} tone="neutral" />
          </View>
        </View>

        {/* «C2»: the mission tells the same story as the appointment (§5.4); the row opens it. */}
        {appointment.missionId ? (
          mission ? (
            <MissionRow mission={mission} onPress={() => onOpenMission(mission.id)} />
          ) : missionQuery.isLoading ? (
            <Skeleton height={84} radius={18} />
          ) : null
        ) : !cancelled && !answered && !hasStarted ? (
          // «C4»: an appointment without mission offers it as the main action of the screen.
          <View style={[styles.card, cardColors(t)]}>
            <View style={styles.row}>
              <IconTile tone="appointment" icon={<Route size={19} strokeWidth={2.2} color={t.accent.calFg} />} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: t.text.primary }]}>Sigue esta cita paso a paso</Text>
                <Text style={[styles.rowMeta, { color: t.text.secondary }]}>Te recordamos qué llevar y guardamos lo que te den.</Text>
              </View>
            </View>
            <Button
              variant="primary"
              fullWidth
              icon={<Route size={16} strokeWidth={2.4} color={t.text.onSolid} />}
              loading={createMission.isPending}
              loadingLabel="Creando…"
              onPress={followAsMission}
            >
              Seguir como misión
            </Button>
          </View>
        ) : null}

        {/* Desde la hora de la cita, la acción principal es confirmar la asistencia. */}
        {hasStarted && !cancelled && !answered ? (
          <View style={[styles.card, cardColors(t)]}>
            <Text style={[styles.h3, { color: t.text.primary }]}>¿Pudiste asistir?</Text>
            <Text style={[styles.sub, { color: t.text.secondary }]}>
              Nunca la marcamos sola aunque haya pasado la hora.
            </Text>
            <Button
              variant="success"
              fullWidth
              icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
              onPress={() => setStatus("ASISTI", "Asistencia registrada")}
            >
              Sí, asistí
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onPress={() => setStatus("NO_ASISTI", "Quedó como no asistida", handleEdit)}
            >
              No pude, reprogramar
            </Button>
          </View>
        ) : null}

        {/* Cuándo, dónde y recordatorio: filas grises con «Cómo llegar» en la fila del lugar. */}
        <View style={[styles.card, cardColors(t)]}>
          <InfoRow
            t={t}
            tone="neutral"
            icon={grayIcon(Clock)}
            title={[formatShortDay(date), formatClock(time)].filter(Boolean).join(" · ")}
            meta={[appointment.duration ? `${appointment.duration} minutos` : null, date ? relativeDay(date) : null]
              .filter(Boolean)
              .join(" · ")}
          />
          {isVirtual && appointment.videoCallLink ? (
            <InfoRow
              t={t}
              tone="neutral"
              icon={grayIcon(Video)}
              title="Videollamada"
              meta={appointment.videoCallLink}
              right={<InlineLink t={t} label="Abrir" onPress={() => void Linking.openURL(appointment.videoCallLink!)} />}
            />
          ) : address ? (
            <InfoRow
              t={t}
              tone="neutral"
              icon={grayIcon(MapPin)}
              title={appointment.location || appointment.clinic || ""}
              meta={appointment.location && appointment.clinic ? appointment.clinic : undefined}
              right={
                <InlineLink
                  t={t}
                  label="Cómo llegar"
                  onPress={() => void Linking.openURL(`http://maps.apple.com/?q=${encodeURIComponent(address)}`)}
                />
              }
            />
          ) : null}
          <InfoRow t={t} tone="neutral" icon={grayIcon(Bell)} title="Recordatorio" meta={reminderLine(appointment.reminderOffsets)} />
          {treatments.length > 0 ? (
            <InfoRow
              t={t}
              tone="neutral"
              icon={grayIcon(Activity)}
              title={treatments.length === 1 ? "Tratamiento" : "Tratamientos"}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              meta={treatments.map((tr: any) => tr.name).join(", ")}
            />
          ) : null}
          {appointment.notes ? (
            <InfoRow t={t} tone="neutral" icon={grayIcon(FileText)} title="Notas" meta={appointment.notes} />
          ) : null}
        </View>

        {/* Documentos y mochilas: para llevar y obtenidos después, con «+ Agregar documento». */}
        <View style={[styles.card, cardColors(t)]}>
          <Text style={[styles.h3, { color: t.text.primary }]}>Documentos y mochilas</Text>
          <Text style={[styles.lbl, { color: t.text.primary }]}>Para llevar</Text>
          {preDocs.length + prePacks.length === 0 ? (
            <Text style={[styles.meta, { color: t.text.secondary }]}>Nada para llevar todavía.</Text>
          ) : null}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {preDocs.map((doc: any) => (
            <InfoRow key={doc.id} t={t} tone="document" icon={<FileText size={19} strokeWidth={2.2} color={t.accent.docFg} />} title={doc.title} meta="Documento" />
          ))}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {prePacks.map((pack: any) => (
            <InfoRow key={pack.id} t={t} tone="backpack" icon={<Backpack size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} title={`Mochila «${pack.name}»`} />
          ))}
          <Text style={[styles.lbl, { color: t.text.primary }]}>Obtenidos después</Text>
          {postDocs.length + postPacks.length === 0 ? (
            <Text style={[styles.meta, { color: t.text.secondary }]}>Aún no hay documentos.</Text>
          ) : null}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {postDocs.map((doc: any) => (
            <InfoRow key={doc.id} t={t} tone="document" icon={<FileText size={19} strokeWidth={2.2} color={t.accent.docFg} />} title={doc.title} meta="Documento" />
          ))}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {postPacks.map((pack: any) => (
            <InfoRow key={pack.id} t={t} tone="backpack" icon={<Backpack size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} title={`Mochila «${pack.name}»`} />
          ))}
          <InlineLink
            t={t}
            label="Agregar documento"
            icon={<Plus size={14} strokeWidth={2.6} color={t.brand.text} />}
            onPress={onAddDocument}
          />
        </View>

        {/* Cita futura: «Reprogramar» secundario y la nota de cuándo se podrá marcar. */}
        {!hasStarted && !cancelled ? (
          <>
            <Button
              variant="secondary"
              fullWidth
              icon={<CalendarDays size={16} color={t.brand.text} />}
              onPress={handleEdit}
            >
              Reprogramar
            </Button>
            {date && time ? (
              <Text style={[styles.meta, styles.center, { color: t.text.secondary }]}>
                Podrás marcarla como completada desde el{" "}
                {WEEKDAY_LONG[new Date(`${date}T12:00:00`).getDay()]} a las {formatClock(time).replace(/\.$/, "")}.
              </Text>
            ) : null}
          </>
        ) : null}

        {/* Una cita ya marcada (asistí / no asistí) queda en el historial: no se ofrece cancelarla. */}
        {!cancelled && !answered ? (
          <DangerLink
            label="Cancelar cita"
            icon={<XCircle size={16} strokeWidth={2.2} color={t.status.errorFg} />}
            onPress={() => setShowCancelDialog(true)}
            disabled={statusMut.isPending}
          />
        ) : null}
      </Animated.ScrollView>

      {showCancelDialog ? (
        // «C5» (RF-29, DU-51): canceling the appointment cancels its mission too, and the dialog says so.
        cancelsMission ? (
          <ConfirmModal
            title="¿Cancelar la cita?"
            message={`Quedará como cancelada y dejaremos de recordártela. Su misión «${mission!.title}» también se cancela.`}
            keepLabel="Mantener cita"
            confirmLabel="Cancelar cita y misión"
            confirmVariant="danger"
            // Mockup «C5»: red tile, centered copy and the two actions stacked («Mantener cita» first).
            icon={<XCircle size={24} strokeWidth={2.2} color={t.status.errorFg} />}
            iconTone="danger"
            actionsLayout="stacked"
            loading={statusMut.isPending}
            onCancel={() => setShowCancelDialog(false)}
            onConfirm={() => setStatus("CANCELADA", "Cita y misión canceladas")}
          />
        ) : (
          <ConfirmModal
            title="¿Cancelar cita?"
            message="La cita queda cancelada en tu historial. No se borra."
            keepLabel="Mantener cita"
            confirmLabel="Cancelar cita"
            confirmVariant="danger"
            loading={statusMut.isPending}
            onCancel={() => setShowCancelDialog(false)}
            onConfirm={() => setStatus("CANCELADA", "Cita cancelada")}
          />
        )
      ) : null}
    </SafeAreaView>
  );
}

const cardColors = (t: ThemeContextValue) => ({ backgroundColor: t.surface.bgCard, borderColor: t.border.default });

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing[6] },
  content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
  // Kit `.card`: radio 18, borde 1 px + canto de 3 px, padding 16 y separación 12
  card: { borderRadius: 18, borderWidth: 1, borderBottomWidth: 4, padding: spacing[4], gap: spacing[3] },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600) },
  rowMeta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  h2: { fontSize: 19, lineHeight: 23, fontFamily: nativeFont("heading", 900) },
  h3: { fontSize: fontSize.md, fontFamily: nativeFont("heading", 800) },
  sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400) },
  lbl: { fontSize: fontSize.sm, fontFamily: nativeFont("heading", 800) },
  meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  center: { textAlign: "center" },
  inlineLink: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, alignSelf: "flex-start" },
  link: { fontSize: fontSize.sm, fontFamily: nativeFont("heading", 800) },
});
