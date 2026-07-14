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
import type { Treatment } from "@helu/api";
import {
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  Chip,
  Button,
  DatePicker,
  todayISODate,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { SelectField } from "../SelectField";
import type { MedicationFilters } from "../../hooks/useMedicationsList";
import { hasActiveMedicationFilters } from "../../hooks/useMedicationsList";

const STATUS_OPTIONS: { value: "active" | "finished"; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "finished", label: "Finalizado" },
];

const FREQUENCY_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "HOUR", label: "Cada hora(s)" },
  { value: "DAY", label: "Cada día(s)" },
  { value: "WEEK", label: "Cada semana(s)" },
  { value: "MONTH", label: "Cada mes(es)" },
  { value: "YEAR", label: "Cada año(s)" },
];

const TODOS = "Todos";

interface MedicationsFilterSheetProps {
  visible: boolean;
  draft: MedicationFilters;
  onChangeDraft: (filters: MedicationFilters) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
  treatments: Treatment[];
}

export function MedicationsFilterSheet({
  visible,
  draft,
  onChangeDraft,
  onClear,
  onApply,
  onClose,
  treatments,
}: MedicationsFilterSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const patch = (partial: Partial<MedicationFilters>) => {
    onChangeDraft({ ...draft, ...partial });
  };

  const canClear = hasActiveMedicationFilters(draft);

  const selectedTreatmentName =
    treatments.find((tx) => tx.id === draft.treatmentId)?.name ?? TODOS;

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
            Filtrar medicamentos
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
            {STATUS_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={draft.status === opt.value}
                onPress={() => patch({ status: opt.value })}
              />
            ))}
          </View>

          <Text style={[styles.subtitle, styles.sectionGap]}>Frecuencia</Text>
          <View style={styles.chipGrid}>
            <Chip
              label={TODOS}
              selected={!draft.frequencyUnit}
              onPress={() => patch({ frequencyUnit: undefined })}
            />
            {FREQUENCY_UNIT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={draft.frequencyUnit === opt.value}
                onPress={() => patch({ frequencyUnit: opt.value })}
              />
            ))}
          </View>

          <Text style={[styles.subtitle, styles.sectionGap]}>Inicio de ciclo</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <DatePicker
                label="Desde"
                value={draft.startDateFrom ?? ""}
                onChange={(startDateFrom) => patch({ startDateFrom })}
                maxDate={draft.startDateTo ?? todayISODate()}
              />
            </View>
            <View style={styles.dateField}>
              <DatePicker
                label="Hasta"
                value={draft.startDateTo ?? ""}
                onChange={(startDateTo) => patch({ startDateTo })}
                minDate={draft.startDateFrom ?? undefined}
                maxDate={todayISODate()}
              />
            </View>
          </View>

          <View style={styles.sectionGap}>
            <SelectField
              label="Tratamiento"
              value={selectedTreatmentName}
              placeholder={TODOS}
              options={[TODOS, ...treatments.map((tx) => tx.name)]}
              onChange={(name) =>
                patch({
                  treatmentId: name === TODOS ? undefined : treatments.find((tx) => tx.name === name)?.id,
                })
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
    dateRow: {
      flexDirection: "row",
      gap: spacing[3],
    },
    dateField: {
      flex: 1,
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
