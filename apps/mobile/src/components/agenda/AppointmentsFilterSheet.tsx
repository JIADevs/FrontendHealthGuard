import { useMemo } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import type { Doctor, Treatment } from "@helu/api";
import {
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  appointmentStatusLabel,
  Chip,
  Button,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { SelectField } from "../SelectField";
import type { AppointmentFilters } from "../../hooks/useAppointmentsList";

const STATUS_OPTIONS = ["PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI"] as const;
const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "APPOINTMENT", label: "Cita" },
  { value: "EXAM", label: "Examen" },
];
const MODALITY_OPTIONS: { value: string; label: string }[] = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIRTUAL", label: "Virtual" },
  { value: "DOMICILIARIA", label: "Domiciliaria" },
];

const TODOS = "Todos";

interface AppointmentsFilterSheetProps {
  visible: boolean;
  draft: AppointmentFilters;
  onChangeDraft: (filters: AppointmentFilters) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
  doctors: Doctor[];
  treatments: Treatment[];
  specialties: string[];
}

export function AppointmentsFilterSheet({
  visible,
  draft,
  onChangeDraft,
  onClear,
  onApply,
  onClose,
  doctors,
  treatments,
  specialties,
}: AppointmentsFilterSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const patch = (partial: Partial<AppointmentFilters>) => {
    onChangeDraft({ ...draft, ...partial });
  };

  const canClear = Object.values(draft).some((v) => !!v);

  const selectedDoctorName = doctors.find((d) => d.id === draft.doctorId)?.name ?? TODOS;
  const selectedTreatmentName = treatments.find((tx) => tx.id === draft.treatmentId)?.name ?? TODOS;

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerSide}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver al listado"
          >
            <ChevronLeft size={24} color={t.text.primary} />
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={1}>
            Filtrar citas
          </Text>

          <TouchableOpacity
            style={styles.headerSide}
            onPress={onClear}
            disabled={!canClear}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros"
          >
            <Text style={[styles.clearText, !canClear && styles.clearTextDisabled]}>
              Limpiar filtros
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Estado</Text>
          <View style={styles.chipGrid}>
            <Chip label={TODOS} selected={!draft.status} onPress={() => patch({ status: undefined })} />
            {STATUS_OPTIONS.map((s) => (
              <Chip
                key={s}
                label={appointmentStatusLabel(s)}
                selected={draft.status === s}
                onPress={() => patch({ status: s })}
              />
            ))}
          </View>

          <Text style={[styles.subtitle, styles.sectionGap]}>Tipo</Text>
          <View style={styles.chipGrid}>
            <Chip label={TODOS} selected={!draft.type} onPress={() => patch({ type: undefined })} />
            {TYPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={draft.type === opt.value}
                onPress={() => patch({ type: opt.value })}
              />
            ))}
          </View>

          <Text style={[styles.subtitle, styles.sectionGap]}>Modalidad</Text>
          <View style={styles.chipGrid}>
            <Chip label={TODOS} selected={!draft.modality} onPress={() => patch({ modality: undefined })} />
            {MODALITY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={draft.modality === opt.value}
                onPress={() => patch({ modality: opt.value })}
              />
            ))}
          </View>

          <View style={styles.sectionGap}>
            <SelectField
              label="Especialidad"
              value={draft.specialty ?? TODOS}
              placeholder={TODOS}
              options={[TODOS, ...specialties]}
              onChange={(value) => patch({ specialty: value === TODOS ? undefined : value })}
            />
          </View>

          <View style={styles.sectionGap}>
            <SelectField
              label="Doctor"
              value={selectedDoctorName}
              placeholder={TODOS}
              options={[TODOS, ...doctors.map((d) => d.name)]}
              onChange={(name) =>
                patch({ doctorId: name === TODOS ? undefined : doctors.find((d) => d.name === name)?.id })
              }
            />
          </View>

          <View style={styles.sectionGap}>
            <SelectField
              label="Tratamiento"
              value={selectedTreatmentName}
              placeholder={TODOS}
              options={[TODOS, ...treatments.map((tx) => tx.name)]}
              onChange={(name) =>
                patch({ treatmentId: name === TODOS ? undefined : treatments.find((tx) => tx.name === name)?.id })
              }
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={onApply}>Aplicar filtros</Button>
        </View>
      </SafeAreaView>
    </RNModal>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
    headerSide: {
      width: 108,
      justifyContent: "center",
    },
    title: {
      flex: 1,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
      textAlign: "center",
    },
    clearText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
      textAlign: "right",
    },
    clearTextDisabled: {
      color: t.text.muted,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[5],
      paddingBottom: spacing[6],
    },
    subtitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      marginBottom: spacing[3],
    },
    sectionGap: {
      marginTop: spacing[5],
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    footer: {
      alignItems: "center",
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
      paddingBottom: spacing[4],
      borderTopWidth: 1,
      borderTopColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
  });
}
