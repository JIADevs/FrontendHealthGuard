import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateMissionMutation, type Mission, type MissionType } from "@helu/api";
import { BOTTOM_ACTION_BAR_HEIGHT, BottomActionBar, TextField, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { notify } from "../../lib/notify";
import { ScreenHeader } from "../ScreenHeader";
import { useIsOnline } from "../states/OfflineBanner";
import { MissionTypePicker } from "./MissionTypePicker";
import { missionField } from "./missionCopy";

/**
 * «Nueva misión · MVP» (v2.17): los cuatro tipos como tarjetas con radio, el dato mínimo y la barra fija
 * «Crear misión». La vía con IA (RF-21) y el tratamiento (RF-26) son para después. Crear espera al
 * servidor; si la cita o el medicamento ya tienen misión, se abre esa (RF-24).
 */
export function MissionNew({
  onCreated,
  onBack,
  initialType = "medical_appointment",
}: {
  onCreated: (mission: Mission) => void;
  onBack?: () => void;
  initialType?: MissionType;
}) {
  const t = useAppTheme();
  const online = useIsOnline();
  const create = useCreateMissionMutation();
  const [type, setType] = useState<MissionType>(initialType);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const field = missionField[type];
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
            <MissionTypePicker
              selected={type}
              onSelect={(ty) => {
                setType(ty);
                setValue("");
                setTouched(false);
              }}
            />
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
});
