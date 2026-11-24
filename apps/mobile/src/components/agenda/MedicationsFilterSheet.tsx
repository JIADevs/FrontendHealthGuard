import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Filter } from "lucide-react-native";
import type { Treatment } from "@helu/api";
import {
  BottomSheet,
  Button,
  ChoiceChips,
  DatePicker,
  IconTile,
  nativeFont,
  spacing,
  todayISODate,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { SelectField } from "../SelectField";
import type { MedicationFilters } from "../../hooks/useMedicationsList";

const ALL = "";
const TODOS = "Todos";

const STATUS_OPTIONS = [
  { value: ALL, label: TODOS },
  { value: "active", label: "Activos" },
  { value: "finished", label: "Finalizados" },
];

/** Same units as the form's «Frecuencia (cada cuánto)» chips. */
const FREQUENCY_UNIT_OPTIONS = [
  { value: ALL, label: TODOS },
  { value: "HOUR", label: "Horas" },
  { value: "DAY", label: "Días" },
  { value: "WEEK", label: "Semanas" },
  { value: "MONTH", label: "Meses" },
  { value: "YEAR", label: "Años" },
];

export interface MedicationsFilterSheetProps {
  initial: MedicationFilters;
  treatments: Treatment[];
  onApply: (filters: MedicationFilters) => void;
  onClose: () => void;
}

/**
 * Filters for Medicamentos as a kit BottomSheet (formularios.md §2: filters open in a bottom
 * sheet), same layout as «DOCUMENTOS · Filtros»: option chips, «Desde» / «Hasta», «Aplicar
 * filtros» and «Limpiar filtros». Nothing applies until «Aplicar».
 */
export function MedicationsFilterSheet({
  initial,
  treatments,
  onApply,
  onClose,
}: MedicationsFilterSheetProps) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [draft, setDraft] = useState<MedicationFilters>(initial);
  const patch = (partial: Partial<MedicationFilters>) =>
    setDraft((d) => ({ ...d, ...partial }));

  const treatmentName =
    treatments.find((tx) => tx.id === draft.treatmentId)?.name ?? TODOS;
  const apply = () => sheetRef.current?.close(() => onApply(draft));

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="MEDICAMENTOS"
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
            onChange={(v) =>
              patch({ status: (v || undefined) as MedicationFilters["status"] })
            }
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.lbl, { color: t.text.primary }]}>
            Frecuencia
          </Text>
          <ChoiceChips
            options={FREQUENCY_UNIT_OPTIONS}
            value={draft.frequencyUnit ?? ALL}
            onChange={(v) => patch({ frequencyUnit: v || undefined })}
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.lbl, { color: t.text.primary }]}>
            Inicio del ciclo
          </Text>
          <View style={styles.dates}>
            <View style={styles.date}>
              <DatePicker
                label="Desde"
                value={draft.startDateFrom ?? ""}
                placeholder="Sin límite"
                maxDate={draft.startDateTo ?? todayISODate()}
                onChange={(v) => patch({ startDateFrom: v || undefined })}
              />
            </View>
            <View style={styles.date}>
              <DatePicker
                label="Hasta"
                value={draft.startDateTo ?? ""}
                placeholder="Hoy"
                minDate={draft.startDateFrom ?? undefined}
                maxDate={todayISODate()}
                onChange={(v) => patch({ startDateTo: v || undefined })}
              />
            </View>
          </View>
        </View>

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
  dates: { flexDirection: "row", gap: spacing[3] },
  date: { flex: 1 },
  actions: { gap: spacing[2] },
});
