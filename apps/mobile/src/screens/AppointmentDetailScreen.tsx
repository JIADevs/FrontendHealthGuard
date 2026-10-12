import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useAppTheme, Spinner, spacing, colors } from "@helu/ui";
import {
  useAppointmentByIdQuery,
  useDeleteAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useTreatmentsByIdsQuery,
  useDocumentsByIdsQuery,
  useBackpacksByIdsQuery,
} from "@helu/api/hooks";
import {
  Calendar, Clock, MapPin, FileText, Stethoscope, Video, Trash2, Edit, Share2,
  FileCheck, DollarSign, ClipboardList, FlaskConical, Bell, Tag, Home,
  Package, Folder, Activity,
} from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { APPOINTMENT_STATUSES } from "../constants/appointments";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DetailHeader } from "../components/DetailHeader";
import { DetailFooter, type FooterAction } from "../components/DetailFooter";
import Toast from "react-native-toast-message";
import { useState, Fragment } from "react";

type AppointmentDetailRouteProp = RouteProp<RootStackParamList, "AppointmentDetail">;

const MODALITY_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIRTUAL: "Virtual",
  DOMICILIARIA: "A domicilio",
};

// A card-style detail cell used in the grid
function DetailCell({
  label,
  value,
  icon,
  fullWidth = false,
}: {
  label: string;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  fullWidth?: boolean;
}) {
  const t = useAppTheme();
  return (
    <View
      style={[
        cellStyles.cell,
        { backgroundColor: t.surface.card },
        fullWidth && cellStyles.fullWidth,
      ]}
    >
      <Text style={[cellStyles.label, { color: t.text.secondary }]}>{label}</Text>
      <View style={cellStyles.row}>
        <View style={cellStyles.icon}>{icon}</View>
        <Text style={[cellStyles.value, { color: t.text.primary }]} numberOfLines={fullWidth ? 4 : 2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell: {
    flex: 1,
    borderRadius: 12,
    padding: spacing[3],
    gap: spacing[2],
    minWidth: 0,
  },
  fullWidth: {
    flex: 0,
    width: "100%",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  icon: {
    width: 20,
    alignItems: "center",
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
});

export function AppointmentDetailScreen() {
  const t = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute<AppointmentDetailRouteProp>();
  const { id } = route.params;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: appointment, isLoading } = useAppointmentByIdQuery(id);

  const treatmentResults = useTreatmentsByIdsQuery(appointment?.treatmentIds ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treatments = treatmentResults.map((r: any) => r.data).filter(Boolean);
  const preDocResults  = useDocumentsByIdsQuery(appointment?.preDocumentIds  ?? []);
  const postDocResults = useDocumentsByIdsQuery(appointment?.postDocumentIds ?? []);
  const prePackResults  = useBackpacksByIdsQuery(appointment?.preBackpackIds  ?? []);
  const postPackResults = useBackpacksByIdsQuery(appointment?.postBackpackIds ?? []);

  const deleteMut = useDeleteAppointmentMutation();
  const statusMut = useUpdateAppointmentStatusMutation();

  const handleDelete = () => setShowDeleteDialog(true);

  const confirmDelete = () => {
    deleteMut.mutate(id, {
      onSuccess: () => {
        Toast.show({ type: "success", text1: "Cita eliminada" });
        setShowDeleteDialog(false);
        setTimeout(() => navigation.goBack(), 500);
      },
      onError: () => {
        Toast.show({ type: "error", text1: "Error al eliminar la cita" });
        setShowDeleteDialog(false);
      },
    });
  };

  const handleMarkAsCompleted = () => {
    statusMut.mutate({ id, status: "ASISTI" }, {
      onSuccess: () => Toast.show({ type: "success", text1: "Estado actualizado" }),
    });
  };

  const handleEdit = () => navigation.navigate("AppointmentForm", { id: appointment.id });
  const handleShare = () => console.log("Compartir cita");

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><Spinner size="lg" /></View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ color: t.text.secondary }}>Cita no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = APPOINTMENT_STATUSES.find((s) => s.value === appointment.status);
  const isExam = appointment.type === "EXAM";

  const dateObj = new Date(appointment.date + "T00:00:00");
  const formattedDay = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const formattedWeekday = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
  const formattedWeekdayCap = formattedWeekday.charAt(0).toUpperCase() + formattedWeekday.slice(1);

  const addMinutes = (timeStr: string, minutes: number) => {
    const [hours, mins] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, mins + minutes, 0, 0);
    return d.toTimeString().slice(0, 5);
  };

  const timeValue = appointment.time?.slice(0, 5) ?? "";
  const [timeHour] = timeValue.split(":");
  const timeAmPm = Number(timeHour) >= 12 ? "PM" : "AM";
  const endTime = appointment.duration
    ? addMinutes(timeValue, appointment.duration)
    : null;

  const titleParts = [];
  if (appointment.specialty) titleParts.push(appointment.specialty);
  if (appointment.doctor) titleParts.push(appointment.doctor);
  const title = titleParts.length > 0
    ? titleParts.join("\n")
    : appointment.name || (isExam ? "Examen médico" : "Cita médica");

  const locationValue = [appointment.clinic, appointment.location].filter(Boolean).join("\n");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preDocs   = preDocResults.map((r: any)  => r.data).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postDocs  = postDocResults.map((r: any) => r.data).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prePacks  = prePackResults.map((r: any)  => r.data).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postPacks = postPackResults.map((r: any) => r.data).filter(Boolean);
  const hasAttachments = preDocs.length + postDocs.length + prePacks.length + postPacks.length > 0;

  const footerActions: FooterAction[] = [
    {
      label: "Reprogramar",
      onPress: handleEdit,
      icon: <Calendar size={18} color={t.text.primary} />,
      variant: "outline",
    },
    {
      label: "Cancelar cita",
      onPress: handleDelete,
      variant: "destructive",
    },
    {
      label: "Marcar como completada",
      onPress: handleMarkAsCompleted,
      variant: "primary",
      disabled: appointment.status === "ASISTI",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <DetailHeader
        actions={[
          { icon: Edit, label: "Editar", onPress: handleEdit },
          { icon: Trash2, label: "Eliminar", onPress: handleDelete, destructive: true },
        ]}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Hero card ── */}
        <View style={[styles.heroCard, { backgroundColor: t.brand.solid }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: t.brand.tintStrong }]}>
              {isExam
                ? <FlaskConical size={28} color={colors.white} />
                : <Stethoscope size={28} color={colors.white} />
              }
            </View>
            <Text style={styles.heroTitle}>{title}</Text>
          </View>
          <View style={styles.heroBadges}>
            {currentStatus && (
              <StatusBadge status={currentStatus.value} label={currentStatus.label} />
            )}
            <StatusBadge status="INFO" label={MODALITY_LABELS[appointment.modality] ?? appointment.modality} />
            {appointment.tags?.map((tag: string) => (
              <Fragment key={tag}>
                <StatusBadge status="INFO" label={tag} />
              </Fragment>
            ))}
          </View>
        </View>

        {/* ── Quick stats strip ── */}
        <View style={[styles.statsStrip, { backgroundColor: t.surface.card }]}>
          <View style={styles.statItem}>
            <Calendar size={16} color={t.text.secondary} />
            <Text style={[styles.statMain, { color: t.text.primary }]}>{formattedDay}</Text>
            <Text style={[styles.statSub, { color: t.text.secondary }]}>{formattedWeekdayCap}</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: t.border.default }]} />

          <View style={styles.statItem}>
            <Clock size={16} color={t.text.secondary} />
            <Text style={[styles.statMain, { color: t.text.primary }]}>{timeValue}</Text>
            <Text style={[styles.statSub, { color: t.text.secondary }]}>
              {endTime ? `hasta ${endTime}` : timeAmPm}
            </Text>
          </View>

          {appointment.cost != null && (
            <>
              <View style={[styles.statDivider, { backgroundColor: t.border.default }]} />
              <View style={styles.statItem}>
                <DollarSign size={16} color={t.text.secondary} />
                <Text style={[styles.statMain, { color: t.text.primary }]}>
                  {appointment.cost.toLocaleString("es-CO")}
                </Text>
                <Text style={[styles.statSub, { color: t.text.secondary }]}>Costo</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Detail cards ── */}
        <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Detalles</Text>

        <View style={styles.grid}>
          {/* Row: Lugar + Tipo de cita + Servicio (todos juntos si existen) */}
          {(() => {
            const locationIcon = appointment.modality === "DOMICILIARIA"
              ? <Home size={18} color={t.text.secondary} />
              : appointment.modality === "VIRTUAL"
              ? <Video size={18} color={t.text.secondary} />
              : <MapPin size={18} color={t.text.secondary} />;

            const examOrServiceLabel = isExam && appointment.examType ? "Tipo de examen" : "Servicio";
            const examOrServiceValue = isExam && appointment.examType ? appointment.examType : appointment.service;
            const examOrServiceIcon = isExam && appointment.examType
              ? <FlaskConical size={18} color={t.text.secondary} />
              : <ClipboardList size={18} color={t.text.secondary} />;

            const cells = [
              locationValue ? { label: "Lugar", value: locationValue, icon: locationIcon } : null,
              appointment.consultationType ? { label: "Tipo de cita", value: appointment.consultationType, icon: <Stethoscope size={18} color={t.text.secondary} /> } : null,
              examOrServiceValue ? { label: examOrServiceLabel, value: examOrServiceValue, icon: examOrServiceIcon } : null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ].filter(Boolean) as { label: string; value: string; icon: any }[];

            if (cells.length === 0) return null;
            if (cells.length === 1) return (
              <DetailCell label={cells[0].label} value={cells[0].value} icon={cells[0].icon} fullWidth />
            );

            // Determine how many columns fit without text wrapping.
            // cellPadding (12*2) + iconArea (20 icon + 8 gap) = 52px overhead per cell.
            const OVERHEAD = spacing[3] * 2 + 20 + spacing[2];
            const CONTENT_PAD = spacing[4] * 2;
            const CHAR_WIDTH = 8; // ~8px per char at fontSize 15 medium
            const maxLineLen = (s: string) => Math.max(...s.split("\n").map(l => l.length));
            const fitsInCols = (n: number) => {
              const gap = spacing[2] * (n - 1);
              const textW = (screenWidth - CONTENT_PAD - gap) / n - OVERHEAD;
              const maxChars = Math.floor(textW / CHAR_WIDTH);
              return cells.every(c => maxLineLen(c.value) <= maxChars);
            };
            const colCount = cells.length === 2
              ? (fitsInCols(2) ? 2 : 1)
              : (fitsInCols(3) ? 3 : fitsInCols(2) ? 2 : 1);

            if (colCount === 1) {
              return (
                <>
                  {cells.map(c => (
                    <Fragment key={c.label}>
                      <DetailCell label={c.label} value={c.value} icon={c.icon} fullWidth />
                    </Fragment>
                  ))}
                </>
              );
            }

            const rows: (typeof cells)[] = [];
            for (let i = 0; i < cells.length; i += colCount) {
              rows.push(cells.slice(i, i + colCount));
            }
            return (
              <>
                {rows.map((row, ri) => (
                  <View key={ri} style={styles.gridRow}>
                    {row.map(c => (
                      <Fragment key={c.label}>
                        <DetailCell label={c.label} value={c.value} icon={c.icon} />
                      </Fragment>
                    ))}
                  </View>
                ))}
              </>
            );
          })()}

          {appointment.modality === "VIRTUAL" && appointment.videoCallLink && (
            <DetailCell
              label="Link de videollamada"
              value={appointment.videoCallLink}
              fullWidth
              icon={<Video size={18} color={t.text.secondary} />}
            />
          )}

          {appointment.treatmentTags && appointment.treatmentTags.length > 0 && (
            <DetailCell
              label="Etiquetas de tratamiento"
              value={appointment.treatmentTags.join(", ")}
              fullWidth
              icon={<Tag size={18} color={t.text.secondary} />}
            />
          )}

          {appointment.customReminder && (
            <DetailCell
              label="Recordatorio"
              value={appointment.customReminder}
              fullWidth
              icon={<Bell size={18} color={t.text.secondary} />}
            />
          )}

          {appointment.notes && (
            <DetailCell
              label="Notas"
              value={appointment.notes}
              fullWidth
              icon={<FileText size={18} color={t.text.secondary} />}
            />
          )}
        </View>

        {/* ── Tratamientos ── */}
        {(appointment.treatmentIds?.length ?? 0) > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
              {(appointment.treatmentIds?.length ?? 0) === 1 ? "Tratamiento" : "Tratamientos"}
            </Text>
            {treatments.length > 0 ? (
              treatments.map((tr: any) => (
                <View key={tr.id} style={[styles.treatmentCard, { backgroundColor: t.surface.card }]}>
                  <View style={[styles.treatmentIcon, { backgroundColor: t.brand.tintMed }]}>
                    <Activity size={20} color={t.brand.fg} />
                  </View>
                  <View style={styles.treatmentBody}>
                    <Text style={[styles.treatmentName, { color: t.text.primary }]}>{tr.name}</Text>
                    {tr.description ? (
                      <Text style={[styles.treatmentDesc, { color: t.text.secondary }]} numberOfLines={2}>
                        {tr.description}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge
                    status={tr.status}
                    label={
                      tr.status === "ACTIVE" ? "Activo"
                      : tr.status === "COMPLETED" ? "Completado"
                      : "Inactivo"
                    }
                  />
                </View>
              ))
            ) : (
              <View style={[styles.treatmentCard, { backgroundColor: t.surface.card }]}>
                <View style={[styles.treatmentIcon, { backgroundColor: t.brand.tintMed }]}>
                  <Activity size={20} color={t.brand.fg} />
                </View>
                <View style={styles.treatmentBody}>
                  <Text style={[styles.treatmentDesc, { color: t.text.secondary }]}>Cargando tratamientos…</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Documentos y mochilas ── */}
        <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Documentos y mochilas</Text>

        {hasAttachments ? (
          <View style={styles.attachmentsList}>
            {preDocs.length > 0 && (
              <View style={styles.attachmentGroup}>
                <Text style={[styles.attachmentGroupLabel, { color: t.text.secondary }]}>Documentos para llevar</Text>
                {preDocs.map((doc: any) => (
                  <View key={doc.id} style={[styles.attachmentRow, { backgroundColor: t.surface.card }]}>
                    <FileCheck size={16} color={t.brand.fg} />
                    <Text style={[styles.attachmentRowText, { color: t.text.primary }]} numberOfLines={1}>
                      {doc.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {prePacks.length > 0 && (
              <View style={styles.attachmentGroup}>
                <Text style={[styles.attachmentGroupLabel, { color: t.text.secondary }]}>Mochilas para llevar</Text>
                {prePacks.map((pack: any) => (
                  <View key={pack.id} style={[styles.attachmentRow, { backgroundColor: t.surface.card }]}>
                    <Package size={16} color={t.brand.fg} />
                    <Text style={[styles.attachmentRowText, { color: t.text.primary }]} numberOfLines={1}>
                      {pack.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {/* Luego lo que salió de la cita */}
            {postDocs.length > 0 && (
              <View style={styles.attachmentGroup}>
                <Text style={[styles.attachmentGroupLabel, { color: t.text.secondary }]}>Documentos obtenidos</Text>
                {postDocs.map((doc: any) => (
                  <View key={doc.id} style={[styles.attachmentRow, { backgroundColor: t.surface.card }]}>
                    <Folder size={16} color={t.brand.fg} />
                    <Text style={[styles.attachmentRowText, { color: t.text.primary }]} numberOfLines={1}>
                      {doc.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {postPacks.length > 0 && (
              <View style={styles.attachmentGroup}>
                <Text style={[styles.attachmentGroupLabel, { color: t.text.secondary }]}>Mochilas obtenidas</Text>
                {postPacks.map((pack: any) => (
                  <View key={pack.id} style={[styles.attachmentRow, { backgroundColor: t.surface.card }]}>
                    <Package size={16} color={t.brand.fg} />
                    <Text style={[styles.attachmentRowText, { color: t.text.primary }]} numberOfLines={1}>
                      {pack.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.emptyAttachments, { borderColor: t.border.default }]}>
            <FileCheck size={28} color={t.text.muted} strokeWidth={1.5} />
            <Text style={[styles.emptyAttachmentsText, { color: t.text.muted }]}>
              Sin documentos ni mochilas adjuntas
            </Text>
          </View>
        )}

      </ScrollView>

      <DetailFooter actions={footerActions} />

      <ConfirmDialog
        visible={showDeleteDialog}
        icon={<Trash2 size={24} color={colors.error[600]} />}
        title="¿Eliminar cita?"
        message="Esta acción no se puede deshacer."
        cancelText="Cancelar"
        confirmText="Eliminar"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        destructive
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  content: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },

  // Hero card
  heroCard: {
    borderRadius: 16,
    padding: spacing[4],
    gap: spacing[3],
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  heroTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 28,
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },

  // Quick stats strip
  statsStrip: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    gap: 2,
  },
  statMain: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  statSub: {
    fontSize: 11,
    textAlign: "center",
    textTransform: "capitalize",
  },
  statDivider: {
    width: 1,
    marginVertical: spacing[3],
  },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Detail grid
  grid: {
    gap: spacing[2],
  },
  gridRow: {
    flexDirection: "row",
    gap: spacing[2],
  },

  // Treatment card
  treatmentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: spacing[3],
    gap: spacing[3],
  },
  treatmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  treatmentBody: {
    flex: 1,
    gap: 2,
  },
  treatmentName: {
    fontSize: 15,
    fontWeight: "600",
  },
  treatmentDesc: {
    fontSize: 12,
  },

  // Attachments list
  attachmentsList: {
    gap: spacing[3],
  },
  attachmentGroup: {
    gap: spacing[2],
  },
  attachmentGroupLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  attachmentRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyAttachments: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    gap: spacing[2],
  },
  emptyAttachmentsText: {
    fontSize: 13,
  },
});
