import { useMemo } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Monitor, Moon, Sun } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPreference, isApiError, setPreference } from "@helu/api";
import { useUiStore } from "@helu/stores";
import { SegmentedControl, nativeFont, radii, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { MascotHint } from "../brand/MascotHint";
import { notify } from "../../lib/notify";

/**
 * Push types the backend skips when `preferences.notifications[type] === false`
 * (BackendHealthGuard `services/notification.py`). Each toggle covers a reminder and its follow-up.
 */
const NOTIFICATION_TOGGLES: { label: string; types: string[] }[] = [
  { label: "Recordatorios de medicamentos", types: ["MEDICATION", "MEDICATION_FOLLOWUP"] },
  { label: "Recordatorios de citas", types: ["APPOINTMENT", "APPOINTMENT_FOLLOWUP"] },
  { label: "Recordatorios de tareas", types: ["AGENDA_TASK", "AGENDA_TASK_FOLLOWUP"] },
  { label: "Check-in diario", types: ["CHECKIN"] },
];

type NotificationPrefs = Record<string, boolean>;
const PREF_KEY = "notifications";
const QUERY_KEY = ["preference", PREF_KEY] as const;

/** Missing preference (404) means every type is on, as the backend assumes. */
async function readNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const { value } = await getPreference(PREF_KEY);
    return value && typeof value === "object" ? (value as NotificationPrefs) : {};
  } catch (err) {
    if (isApiError(err) && err.status === 404) return {};
    throw err;
  }
}

/**
 * Mockup «Configuración» (module 9): «Apariencia» as a segmented control, «Notificaciones» with one
 * toggle per kind of reminder (they are real: the backend reads them before every push) and the
 * hint «Los cambios se guardan al instante.». Toggles save optimistically and roll back on error.
 */
export function Settings() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const qc = useQueryClient();
  const prefs = useQuery({ queryKey: QUERY_KEY, queryFn: readNotificationPrefs, staleTime: 60_000 });

  const save = useMutation({
    mutationFn: (next: NotificationPrefs) => setPreference(PREF_KEY, next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<NotificationPrefs>(QUERY_KEY);
      qc.setQueryData(QUERY_KEY, next);
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      qc.setQueryData(QUERY_KEY, ctx?.previous);
      notify({ tone: "error", message: "No se pudo guardar", description: "Revisa tu conexión e intenta de nuevo." });
    },
  });

  const current = prefs.data ?? {};
  const isOn = (types: string[]) => types.every((type) => current[type] !== false);
  const toggle = (types: string[], on: boolean) => {
    const next = { ...current };
    for (const type of types) next[type] = on;
    save.mutate(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Configuración" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.h3} accessibilityRole="header">
            Apariencia
          </Text>
          <SegmentedControl
            options={[
              { value: "light", label: "Claro", icon: <Sun size={16} color={t.text.secondary} /> },
              { value: "dark", label: "Oscuro", icon: <Moon size={16} color={t.text.secondary} /> },
              { value: "system", label: "Sistema", icon: <Monitor size={16} color={t.text.secondary} /> },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as "light" | "dark" | "system")}
            accessibilityLabel="Apariencia"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.h3} accessibilityRole="header">
            Notificaciones
          </Text>
          {NOTIFICATION_TOGGLES.map((item, i) => (
            <View key={item.label}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.toggleRow}>
                <Text style={styles.label}>{item.label}</Text>
                <Switch
                  value={isOn(item.types)}
                  onValueChange={(on) => toggle(item.types, on)}
                  disabled={prefs.isLoading}
                  trackColor={{ true: t.brand.solid, false: t.border.medium }}
                  accessibilityLabel={item.label}
                />
              </View>
            </View>
          ))}
        </View>

        <MascotHint pose="happy" text="Los cambios se guardan al instante." />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[4], paddingBottom: spacing[10] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[3],
    },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    toggleRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44 },
    label: { flex: 1, fontSize: 15, fontFamily: nativeFont("body", 500), color: t.text.primary },
    divider: { height: 1, backgroundColor: t.border.default },
  });
}
