import { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import {
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
import type { Medication } from "@helu/api";
import { useMedicationForm } from "../hooks/useMedicationForm";

// ─── Props ───────────────────────────────────────────────────────────────────

interface MedicationFormModalProps {
  initial: Medication | null;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MedicationFormModal({ initial, onClose }: MedicationFormModalProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const form = useMedicationForm({ initial, onClose });

  return (
    <Modal
      title={form.isEdit ? "Editar Medicamento" : "Nuevo Medicamento"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Registrar"}
          </Button>
        </>
      }
    >
      <TextField label="Nombre del medicamento" value={form.name} onChange={form.setName} placeholder="Ej: Ibuprofeno 400mg" />
      <TextField label="Dosis" value={form.dosage} onChange={form.setDosage} placeholder="Ej: 1 tableta" />
      <TextField label="Frecuencia (horas)" value={form.frequency} onChange={form.setFrequency} placeholder="8" keyboardType="number-pad" />
      <DateTimePicker
        label="Inicio y primera toma"
        value={form.startDate && form.firstIntakeTime ? `${form.startDate}T${form.firstIntakeTime}` : ""}
        onChange={(v) => { form.setStartDate(v.slice(0, 10)); form.setFirstIntakeTime(v.slice(11, 16)); }}
        required
      />
      <TextField label="Indicaciones (opcional)" value={form.indications} onChange={form.setIndications} placeholder="Ej: Tomar con alimentos" />

      {form.error && <Text style={styles.errorText}>{form.error}</Text>}
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
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
