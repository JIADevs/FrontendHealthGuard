import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  radii,
  useAppTheme,
  Button,
  Modal,
  TextField,
  DateTimePicker,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { Appointment } from "@helu/api";
import { useAppointmentForm } from "../hooks/useAppointmentForm";

// ─── Props ───────────────────────────────────────────────────────────────────

interface AppointmentFormModalProps {
  initial: Appointment | null;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AppointmentFormModal({ initial, onClose }: AppointmentFormModalProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const form = useAppointmentForm({ initial, onClose });

  return (
    <Modal
      title={form.isEdit ? "Editar Cita" : "Nueva Cita"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Agendar Cita"}
          </Button>
        </>
      }
    >
      <Text style={styles.fieldLabel}>Tipo de evento</Text>
      <View style={styles.typeRow}>
        {(["APPOINTMENT", "EXAM"] as const).map((tp) => (
          <TouchableOpacity
            key={tp}
            style={[styles.typePill, form.type === tp && styles.typePillActive]}
            onPress={() => form.setType(tp)}
          >
            <Text
              style={[
                styles.typePillText,
                form.type === tp && styles.typePillTextActive,
              ]}
            >
              {tp === "APPOINTMENT" ? "Cita Médica" : "Examen"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {form.type === "EXAM" && (
        <TextField
          label="Tipo de examen"
          value={form.examType}
          onChange={form.setExamType}
          placeholder="Ej: Resonancia, Hemograma..."
        />
      )}

      <TextField label="Especialidad" value={form.specialty} onChange={form.setSpecialty} placeholder="Ej: Neurología" />
      <TextField label="Médico" value={form.doctor} onChange={form.setDoctor} placeholder="Dr. nombre" />
      <TextField label="Lugar" value={form.location} onChange={form.setLocation} placeholder="Hospital / Clínica" />
      <DateTimePicker
        label="Fecha y hora"
        value={form.date && form.time ? `${form.date}T${form.time}` : ""}
        onChange={(v) => { form.setDate(v.slice(0, 10)); form.setTime(v.slice(11, 16)); }}
        required
      />

      {form.error && <Text style={styles.errorText}>{form.error}</Text>}
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.primary,
      marginBottom: spacing[2],
    },
    typeRow: {
      flexDirection: "row",
      gap: spacing[2],
    },
    typePill: {
      flex: 1,
      paddingVertical: spacing[2],
      borderRadius: radii.md,
      alignItems: "center",
      backgroundColor: t.surface.bg,
      borderWidth: 1,
      borderColor: t.border.medium,
    },
    typePillActive: {
      backgroundColor: t.brand.fg,
      borderColor: t.brand.fg,
    },
    typePillText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
    },
    typePillTextActive: {
      color: colors.white,
    },
    errorText: {
      color: t.status.errorFg,
      fontSize: fontSize.sm,
      marginTop: spacing[3],
      backgroundColor: t.status.errorBg,
      padding: spacing[3],
      borderRadius: radii.sm,
    },
  });
}
