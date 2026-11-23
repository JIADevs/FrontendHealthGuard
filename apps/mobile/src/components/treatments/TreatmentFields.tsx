import { useMemo, useRef, type ComponentRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DatePicker, TextField, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import type { TreatmentForm } from "../../hooks/useTreatmentForm";

export interface TreatmentFieldsProps {
  form: TreatmentForm;
  /** The sheet opens with the keyboard on «Nombre»; editing does not. */
  autoFocus?: boolean;
}

/**
 * Fields of mockup «Nuevo tratamiento» (m3), shared with «Editar tratamiento»: «Nombre», «Descripción
 * (opcional)» and «Inicio» + «Fin (opcional)» side by side (formularios.md §5 allows that pair on
 * one row). The date picker cannot be emptied, so a chosen «Fin» gets «Quitar fecha» under it.
 */
export function TreatmentFields({ form, autoFocus = false }: TreatmentFieldsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const descriptionRef = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <>
      <TextField
        label="Nombre"
        value={form.name}
        onChange={form.setName}
        onBlur={form.onNameBlur}
        placeholder="Ej: Migraña, Alopecia, Dolor lumbar"
        autoCapitalize="sentences"
        autoFocus={autoFocus}
        returnKeyType="next"
        onSubmitEditing={() => descriptionRef.current?.focus()}
        inputRef={form.nameRef}
        error={form.nameError}
      />
      <TextField
        label="Descripción (opcional)"
        value={form.description}
        onChange={form.setDescription}
        placeholder="Ej: Dolor al subir escaleras"
        multiline
        numberOfLines={3}
        inputRef={descriptionRef}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <DatePicker
            label="Inicio"
            value={form.startDate}
            onChange={form.setStartDate}
            placeholder="Elige la fecha"
            error={form.startDateError}
          />
        </View>
        <View style={styles.half}>
          <DatePicker
            label="Fin (opcional)"
            value={form.endDate}
            onChange={form.setEndDate}
            placeholder="Ej: 30 nov"
            minDate={form.startDate || undefined}
            error={form.endDateError}
          />
          {form.endDate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar fecha de fin"
              onPress={() => form.setEndDate("")}
              style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
            >
              <Text style={styles.clearText}>Quitar fecha</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
    half: { flex: 1, minWidth: 0 },
    // A link with a 44 px touch area (#35), aligned with the field's left edge.
    clear: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
    pressed: { opacity: 0.6 },
    clearText: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.text },
  });
}
