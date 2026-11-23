import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Activity } from "lucide-react-native";
import { BottomSheet, Button, IconTile, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";
import { useTreatmentForm } from "../../hooks/useTreatmentForm";
import { notify } from "../../lib/notify";
import { TreatmentFields } from "./TreatmentFields";
import { TreatmentSaveBanner } from "./TreatmentSaveBanner";

export interface TreatmentCreateSheetProps {
  onClose: () => void;
}

/**
 * Mockup «Nuevo tratamiento» (m3): «v2 · Hoja (pocos campos). Un tratamiento nuevo siempre empieza
 * activo, así que ya no se pide el estado.» Saving waits for the server (§8: not a low-risk action):
 * then the sheet goes down, the list shows the new card highlighted in «Activos» and the toast says
 * «Tratamiento creado». Closing with something typed asks «¿Descartar los cambios?». A failed save
 * shows a banner above the button (on iOS a toast would render under the sheet).
 */
export function TreatmentCreateSheet({ onClose }: TreatmentCreateSheetProps) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const form = useTreatmentForm({
    showErrorAs: "banner",
    onSaved: (name) =>
      sheetRef.current?.close(() => notify({ message: "Tratamiento creado", description: name })),
  });

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="TRATAMIENTOS"
      title="Nuevo tratamiento"
      icon={
        <IconTile
          tone="treatment"
          size="lg"
          round
          icon={<Activity size={24} strokeWidth={2.4} color={t.accent.treatmentFg} />}
        />
      }
      dirty={form.dirty}
      onClose={onClose}
    >
      <View style={styles.body}>
        <TreatmentFields form={form} autoFocus />
        {form.saveFailure ? (
          <TreatmentSaveBanner
            message={form.saveFailure.message}
            onRetry={form.saveFailure.canRetry ? form.save : undefined}
          />
        ) : null}
        <Button size="lg" fullWidth onPress={form.save} loading={form.saving} loadingLabel="Creando…" disabled={form.saving}>
          Crear tratamiento
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[4] },
});
