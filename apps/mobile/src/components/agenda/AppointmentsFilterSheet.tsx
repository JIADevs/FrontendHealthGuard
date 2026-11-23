import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Filter } from "lucide-react-native";
import type { Doctor, Treatment } from "@helu/api";
import {
  BottomSheet,
  Button,
  ChoiceChips,
  IconTile,
  appointmentStatusLabel,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { SelectField } from "../SelectField";
import type { AppointmentFilters } from "../../hooks/useAppointmentsList";

const ALL = "";
const TODOS = "Todos";

const STATUS_OPTIONS = [
  { value: ALL, label: TODOS },
  ...(["PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI"] as const).map((s) => ({
    value: s,
    label: appointmentStatusLabel(s),
  })),
];
const TYPE_OPTIONS = [
  { value: ALL, label: TODOS },
  { value: "APPOINTMENT", label: "Cita médica" },
  { value: "EXAM", label: "Examen" },
];
const MODALITY_OPTIONS = [
  { value: ALL, label: TODOS },
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIRTUAL", label: "Virtual" },
  { value: "DOMICILIARIA", label: "Domiciliaria" },
];

export interface AppointmentsFilterSheetProps {
  initial: AppointmentFilters;
  doctors: Doctor[];
  treatments: Treatment[];
  specialties: string[];
  onApply: (filters: AppointmentFilters) => void;
  onClose: () => void;
}

/**
 * Filters for Citas as a kit BottomSheet (formularios.md §2), same layout as «DOCUMENTOS ·
 * Filtros»: option chips, the pickers, «Aplicar filtros» and «Limpiar filtros». Nothing applies
 * until «Aplicar».
 */
export function AppointmentsFilterSheet({
  initial,
  doctors,
  treatments,
  specialties,
  onApply,
  onClose,
}: AppointmentsFilterSheetProps) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [draft, setDraft] = useState<AppointmentFilters>(initial);
  const patch = (partial: Partial<AppointmentFilters>) =>
    setDraft((d) => ({ ...d, ...partial }));

  const doctorName =
    doctors.find((d) => d.id === draft.doctorId)?.name ?? TODOS;
  const treatmentName =
    treatments.find((tx) => tx.id === draft.treatmentId)?.name ?? TODOS;
  const apply = () => sheetRef.current?.close(() => onApply(draft));

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="CITAS"
      title="Filtros"
      icon={
        <IconTile
          tone="neutral"
          size="lg"
          round
          icon={<Filter size={22} strokeWidth={2.4} color={t.text.onMuted} />}
        />
      }
      onClose={onClose}
    >
      <View style={styles.body}>
        <View style={styles.group}>
          <Text style={[styles.lbl, { color: t.text.primary }]}>Estado</Text>
          <ChoiceChips
            options={STATUS_OPTIONS}
            value={draft.status ?? ALL}
            onChange={(v) => patch({ status: v || undefined })}
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.lbl, { color: t.text.primary }]}>
            Tipo de consulta
          </Text>
          <ChoiceChips
            options={TYPE_OPTIONS}
            value={draft.type ?? ALL}
            onChange={(v) => patch({ type: v || undefined })}
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.lbl, { color: t.text.primary }]}>Modalidad</Text>
          <ChoiceChips
            options={MODALITY_OPTIONS}
            value={draft.modality ?? ALL}
            onChange={(v) => patch({ modality: v || undefined })}
          />
        </View>

        {specialties.length > 0 ? (
          <SelectField
            label="Especialidad"
            value={draft.specialty ?? TODOS}
            placeholder={TODOS}
            options={[TODOS, ...specialties]}
            onChange={(value) =>
              patch({ specialty: value === TODOS ? undefined : value })
            }
          />
        ) : null}

        {doctors.length > 0 ? (
          <SelectField
            label="Profesional de salud"
            value={doctorName}
            placeholder={TODOS}
            options={[TODOS, ...doctors.map((d) => d.name)]}
            onChange={(name) =>
              patch({
                doctorId:
                  name === TODOS
                    ? undefined
                    : doctors.find((d) => d.name === name)?.id,
              })
            }
          />
        ) : null}

        {treatments.length > 0 ? (
          <SelectField
            label="Tratamiento"
            value={treatmentName}
            placeholder={TODOS}
            options={[TODOS, ...treatments.map((tx) => tx.name)]}
            onChange={(name) =>
              patch({
                treatmentId:
                  name === TODOS
                    ? undefined
                    : treatments.find((tx) => tx.name === name)?.id,
              })
            }
          />
        ) : null}

        <View style={styles.actions}>
          <Button size="lg" fullWidth onPress={apply}>
            Aplicar filtros
          </Button>
          <Button variant="ghost" fullWidth onPress={() => setDraft({})}>
            Limpiar filtros
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[5] },
  group: { gap: spacing[2] },
  lbl: { fontSize: 13, fontFamily: nativeFont("heading", 800) },
  actions: { gap: spacing[2] },
});
