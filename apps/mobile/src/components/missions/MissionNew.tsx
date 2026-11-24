import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateMissionMutation, type Mission, type MissionType } from "@helu/api";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  IconTile,
  TextField,
  nativeFont,
  spacing,
  useAppTheme,
} from "@helu/ui";
import { notify } from "../../lib/notify";
import { ScreenHeader } from "../ScreenHeader";
import { useIsOnline } from "../states/OfflineBanner";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { missionTypeHint, missionTypeLabel, missionTypeTone } from "./missionCopy";

const TYPES: MissionType[] = ["medical_appointment", "medication", "medical_exam", "therapy"];

/** Dato mínimo por tipo (mission_details.py): solo lo que hace falta para empezar. */
const FIELD: Record<MissionType, { label: string; placeholder: string; key: string; required: boolean }> = {
  medical_appointment: { label: "Especialidad (opcional)", placeholder: "Ej: Ortopedia", key: "specialty", required: false },
  medical_exam: { label: "¿Qué examen?", placeholder: "Ej: Resonancia magnética de rodilla", key: "exam_name", required: true },
  medication: { label: "¿Qué medicamento? (opcional)", placeholder: "Ej: Metformina 850 mg", key: "medication_name", required: false },
  therapy: { label: "¿Qué terapia?", placeholder: "Ej: Fisioterapia", key: "therapy_type", required: true },
};

/**
 * «Nueva misión · MVP» (v2.17): los cuatro tipos como tarjetas con radio, el dato mínimo y la barra fija
 * «Crear misión». La vía con IA (RF-21) y el tratamiento (RF-26) son para después. Crear espera al
 * servidor; si la cita o el medicamento ya tienen misión, se abre esa (RF-24).
 */
export function MissionNew({ onCreated, onBack }: { onCreated: (mission: Mission) => void; onBack?: () => void }) {
  const t = useAppTheme();
  const online = useIsOnline();
  const create = useCreateMissionMutation();
  const [type, setType] = useState<MissionType>("medical_appointment");
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const field = FIELD[type];
  const error = touched && field.required && !value.trim() ? "Escribe cuál es para poder crear la misión." : undefined;

  const submit = () => {
    setTouched(true);
    if (field.required && !value.trim()) return;
    if (!online) return notify({ tone: "warning", message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." });
    const details = value.trim() ? { [field.key]: value.trim() } : {};
    create.mutate(
      { type, details },
      {
        onSuccess: (mission) => {
          notify({ message: "Misión creada", description: mission.title });
          onCreated(mission);
        },
        onError: () => notify({ tone: "error", message: "No se pudo crear la misión", description: "Inténtalo de nuevo." }),
      },
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]} edges={["top"]}>
      <ScreenHeader title="Nueva misión" onBack={onBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + spacing[8] }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
            <Text style={[styles.h3, { color: t.text.primary }]}>¿Qué quieres conseguir?</Text>
            <View accessibilityRole="radiogroup" style={{ gap: spacing[2] }}>
              {TYPES.map((ty) => {
                const selected = ty === type;
                return (
                  <Pressable
                    key={ty}
                    onPress={() => {
                      setType(ty);
                      setValue("");
                      setTouched(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        borderColor: selected ? t.brand.solid : t.border.default,
                        backgroundColor: selected ? t.brand.tint : t.surface.bgCard,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <IconTile tone={missionTypeTone[ty]} icon={<MissionTypeIcon type={ty} size={19} color={t.text.secondary} />} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: t.text.primary }]}>{missionTypeLabel[ty]}</Text>
                      <Text style={[styles.optionHint, { color: t.text.secondary }]}>{missionTypeHint[ty]}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: selected ? t.brand.solid : t.border.default }]}>
                      {selected ? <View style={[styles.radioDot, { backgroundColor: t.brand.solid }]} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
            <TextField
              label={field.label}
              value={value}
              onChange={setValue}
              placeholder={field.placeholder}
              error={error}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomActionBar primary={{ label: "Crear misión", onPress: submit, loading: create.isPending, loadingLabel: "Creando…" }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  card: { gap: spacing[3], padding: spacing[4], borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  h3: { fontSize: 16, fontFamily: nativeFont("heading", 800) },
  option: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 12, borderRadius: 16, borderWidth: 1.5 },
  optionTitle: { fontSize: 15, fontFamily: nativeFont("body", 600) },
  optionHint: { fontSize: 13, fontFamily: nativeFont("body", 400) },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
});
