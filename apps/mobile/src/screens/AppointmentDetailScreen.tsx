import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useAppTheme, Button, Spinner, spacing, EmptyState, colors } from "@helu/ui";
import { useAppointmentsQuery, useDeleteAppointmentMutation, useUpdateAppointmentStatusMutation } from "@helu/api/hooks";
import { Calendar, Clock, MapPin, User, FileText, DollarSign, Hospital, Stethoscope, Video, Trash2, Edit, Share2, FileCheck } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { APPOINTMENT_STATUSES } from "../constants/appointments";
import { InfoRow } from "../components/InfoRow";
import { StatusBadge } from "../components/StatusBadge";
import { ActionButtons } from "../components/ActionButtons";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FeedbackToast } from "../components/FeedbackToast";
import { DetailHeader } from "../components/DetailHeader";
import { useFeedbackToast } from "../hooks/useFeedbackToast";
import { useState } from "react";

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
            {appointment.name || appointment.specialty || "Cita médica"}
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
        </View>

        {/* Info sections */}
        <View style={styles.section}>
          <InfoRow
            icon={<Calendar size={20} color={t.text.secondary} />}
            label="Fecha"
            value={formattedDate}
          />
        </View>

        <View style={styles.section}>
          <InfoRow
            icon={<Clock size={20} color={t.text.secondary} />}
            label="Hora"
            value={`${appointment.time?.slice(0, 5)}${appointment.duration ? ` (${appointment.duration} min)` : ""}`}
          />
        </View>

        {appointment.modality === "VIRTUAL" && appointment.videoCallLink && (
          <View style={styles.section}>
            <InfoRow
              icon={<Video size={20} color={t.text.secondary} />}
              label="Link de videollamada"
              value={appointment.videoCallLink}
            />
          </View>
        )}

        {appointment.modality === "PRESENCIAL" && appointment.location && (
          <View style={styles.section}>
            <InfoRow
              icon={<MapPin size={20} color={t.text.secondary} />}
              label="Lugar"
              value={appointment.location}
            />
          </View>
        )}

        {appointment.doctor && (
          <View style={styles.section}>
            <InfoRow
              icon={<User size={20} color={t.text.secondary} />}
              label="Profesional"
              value={appointment.doctor}
            />
          </View>
        )}

        {appointment.clinic && (
          <View style={styles.section}>
            <InfoRow
              icon={<Hospital size={20} color={t.text.secondary} />}
              label="Clínica / IPS / Hospital"
              value={appointment.clinic}
            />
          </View>
        )}

        {appointment.specialty && (
          <View style={styles.section}>
            <InfoRow
              icon={<Stethoscope size={20} color={t.text.secondary} />}
              label="Especialidad"
              value={appointment.specialty}
            />
          </View>
        )}

        {appointment.service && (
          <View style={styles.section}>
            <InfoRow label="Servicio" value={appointment.service} />
          </View>
        )}

        {appointment.consultationType && (
          <View style={styles.section}>
            <InfoRow label="Tipo de cita" value={appointment.consultationType} />
          </View>
        )}
        {appointment.type && appointment.type !== "APPOINTMENT" && (
          <View style={styles.section}>
            <InfoRow label="Tipo" value={appointment.type} />
          </View>
        )}

        {appointment.examType && (
          <View style={styles.section}>
            <InfoRow label="Tipo de examen" value={appointment.examType} />
          </View>
        )}


        {appointment.cost && (
          <View style={styles.section}>
            <InfoRow
              icon={<DollarSign size={20} color={t.text.secondary} />}
              label="Costo"
              value={`$${appointment.cost}`}
            />
          </View>
        )}

        {appointment.notes && (
          <View style={styles.section}>
            <InfoRow
              icon={<FileText size={20} color={t.text.secondary} />}
              label="Notas"
              value={appointment.notes}
            />
          </View>
        )}

        {appointment.customReminder && (
          <View style={styles.section}>
            <InfoRow label="Recordatorio" value={appointment.customReminder} />
          </View>
        )}

        {appointment.tags && appointment.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: t.text.secondary }]}>
              Etiquetas
            </Text>
            <View style={styles.tagsRow}>
              {appointment.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: t.brand.tintMed }]}>
                  <Text style={[styles.tagText, { color: t.brand.fg }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {appointment.treatmentTags && appointment.treatmentTags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: t.text.secondary }]}>
              Etiquetas de tratamiento
            </Text>
            <View style={styles.tagsRow}>
              {appointment.treatmentTags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: t.brand.tintMed }]}>
                  <Text style={[styles.tagText, { color: t.brand.fg }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Documents placeholder */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.text.secondary }]}>
            DOCUMENTOS RELACIONADOS
          </Text>
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon={<FileCheck size={48} color={t.text.tertiary} strokeWidth={1.5} />}
              message="No tienes citas agendadas"
              description="Cuando crees una cita, aparecerá aquí."
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: t.surface.bgCard, borderTopColor: t.border.light }]}>
        <ActionButtons
          onReschedule={() => navigation.goBack()}
          onCancel={handleDelete}
        />
        <Button onPress={handleMarkAsCompleted} disabled={appointment.status === "ASISTI"}>
          Marcar como completada
        </Button>
      </View>

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
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    flexWrap: "wrap",
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
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
  },
});