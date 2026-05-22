import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useAppTheme, Spinner, spacing, EmptyState, colors } from "@helu/ui";
import { useAppointmentsQuery, useDeleteAppointmentMutation, useUpdateAppointmentStatusMutation } from "@helu/api/hooks";
import { Calendar, Clock, MapPin, FileText, Stethoscope, Video, Trash2, Edit, Share2, FileCheck, DollarSign, ClipboardList } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { APPOINTMENT_STATUSES } from "../constants/appointments";
import { InfoRow } from "../components/InfoRow";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FeedbackToast } from "../components/FeedbackToast";
import { DetailHeader } from "../components/DetailHeader";
import { DetailFooter, type FooterAction } from "../components/DetailFooter";
import { useFeedbackToast } from "../hooks/useFeedbackToast";
import { useState, Fragment } from "react";

type AppointmentDetailRouteProp = RouteProp<RootStackParamList, "AppointmentDetail">;

export function AppointmentDetailScreen() {
  const t = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<AppointmentDetailRouteProp>();
  const { id } = route.params;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useFeedbackToast();

  const appointmentsQuery = useAppointmentsQuery("", 1, 100);
  const appointment = appointmentsQuery.data?.items.find((a) => a.id === id);

  const deleteMut = useDeleteAppointmentMutation();
  const statusMut = useUpdateAppointmentStatusMutation();

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMut.mutate(id, {
      onSuccess: () => {
        showSuccess("Documento eliminado", {
          actionText: "Deshacer",
          onAction: () => {
            // TODO: Implement undo functionality
            hideToast();
          },
        });
        setShowDeleteDialog(false);
        setTimeout(() => navigation.goBack(), 500);
      },
      onError: () => {
        showError("Error al eliminar la cita");
        setShowDeleteDialog(false);
      },
    });
  };

  const handleMarkAsCompleted = () => {
    statusMut.mutate({ id, status: "ASISTI" }, {
      onSuccess: () => {
        showSuccess("Estado actualizado");
      },
    });
  };

  const handleEdit = () => {
    navigation.navigate("AppointmentForm", { appointment });
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Compartir cita");
  };

  if (appointmentsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={{ color: t.text.secondary }}>Cita no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = APPOINTMENT_STATUSES.find((s) => s.value === appointment.status);
  const formattedDate = new Date(appointment.date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Helper to add minutes to time string (HH:mm)
  const addMinutes = (timeStr: string, minutes: number) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return date.toTimeString().slice(0, 5);
  };

  // Format title: "Specialty — Doctor Name"
  const titleParts = [];
  if (appointment.specialty) titleParts.push(appointment.specialty);
  if (appointment.doctor) titleParts.push(appointment.doctor);
  const title = titleParts.length > 0 ? titleParts.join(" — ") : appointment.name || "Cita médica";

  // Format time with duration
  const timeValue = appointment.time?.slice(0, 5) || "";
  const timeWithDuration = appointment.duration && timeValue
    ? `${timeValue} – ${addMinutes(timeValue, appointment.duration)} (${appointment.duration} min)`
    : timeValue;

  // Format location with clinic and address
  const locationValue = [appointment.clinic, appointment.location].filter(Boolean).join("\n");

  // Footer actions
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
          { icon: Share2, label: "Compartir", onPress: handleShare },
          { icon: Trash2, label: "Eliminar", onPress: handleDelete, destructive: true },
        ]}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: t.brand.tintMed }]}>
            <Calendar size={32} color={t.brand.fg} />
          </View>
          <Text style={[styles.title, { color: t.text.primary }]}>
            {title}
          </Text>
        </View>

        {/* Status badges */}
        <View style={styles.badgesRow}>
          {currentStatus && (
            <StatusBadge status={currentStatus.value} label={currentStatus.label} />
          )}
          {appointment.modality && appointment.modality !== "PRESENCIAL" && (
            <StatusBadge status="INFO" label={appointment.modality} />
          )}
          {appointment.tags?.map((tag: string) => (
            <Fragment key={tag}>
              <StatusBadge status="INFO" label={tag} />
            </Fragment>
          ))}
        </View>

        {/* Info section - compact layout like the design */}
        <View style={styles.infoSection}>
          <InfoRow
            icon={<Calendar size={20} color={t.text.secondary} />}
            label="Fecha"
            value={formattedDate}
          />

          <InfoRow
            icon={<Clock size={20} color={t.text.secondary} />}
            label="Hora"
            value={timeWithDuration}
          />

          {appointment.modality === "VIRTUAL" && appointment.videoCallLink && (
            <InfoRow
              icon={<Video size={20} color={t.text.secondary} />}
              label="Link de videollamada"
              value={appointment.videoCallLink}
            />
          )}

          {appointment.modality === "PRESENCIAL" && locationValue && (
            <InfoRow
              icon={<MapPin size={20} color={t.text.secondary} />}
              label="Lugar"
              value={locationValue}
            />
          )}

          {appointment.consultationType && (
            <InfoRow
              icon={<Stethoscope size={20} color={t.text.secondary} />}
              label="Tipo de cita"
              value={appointment.consultationType}
            />
          )}

          {appointment.service && (
            <InfoRow
              icon={<ClipboardList size={20} color={t.text.secondary} />}
              label="Servicio"
              value={appointment.service}
            />
          )}

          {appointment.cost != null && (
            <InfoRow
              icon={<DollarSign size={20} color={t.text.secondary} />}
              label="Costo"
              value={appointment.cost.toLocaleString("es-CO")}
            />
          )}

          {appointment.notes && (
            <InfoRow
              icon={<FileText size={20} color={t.text.secondary} />}
              label="Notas"
              value={appointment.notes}
            />
          )}
        </View>

        {/* Documents placeholder */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.text.secondary }]}>
            DOCUMENTOS RELACIONADOS
          </Text>
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon={<FileCheck size={48} color={t.text.tertiary} strokeWidth={1.5} />}
              message="Sin documentos adjuntos"
              description="Los documentos relacionados aparecerán aquí."
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <DetailFooter actions={footerActions} />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        icon={<Trash2 size={24} color={colors.error[600]} />}
        title="¿Eliminar documento?"
        message="Esta acción no se puede deshacer."
        cancelText="Cancelar"
        confirmText="Eliminar"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        destructive
      />

      {/* Feedback toast */}
      <FeedbackToast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        actionText={toast.actionText}
        onAction={toast.onAction}
        onDismiss={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    gap: spacing[4],
  },
  header: {
    alignItems: "flex-start",
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "left",
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
  infoSection: {
    gap: spacing[3],
  },
  section: {
    gap: spacing[2],
  },
  emptyStateContainer: {
    minHeight: 200,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
