import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sun, Moon, Monitor } from "lucide-react-native";
import { useUiStore } from "@helu/stores";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  shadows,
  useAppTheme,
  Typography,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

// ─── Theme options ───────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: "light" as const, label: "Claro", Icon: Sun },
  { value: "dark" as const, label: "Oscuro", Icon: Moon },
  { value: "system" as const, label: "Sistema", Icon: Monitor },
] as const;

// ─── Screen ──────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Apariencia */}
        <View style={styles.sectionTitle}>
          <Typography variant="overline" color="secondary">
            Apariencia
          </Typography>
        </View>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.themeBtn, active && styles.themeBtnActive]}
                  onPress={() => setTheme(opt.value)}
                  activeOpacity={0.7}
                >
                  <opt.Icon size={22} color={active ? t.brand.fg : t.text.muted} />
                  <Text style={[styles.themeBtnLabel, active && styles.themeBtnLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Placeholder for future settings */}
        <View style={styles.hint}>
          <Typography variant="bodySm" color="muted">
            Más opciones de configuración próximamente.
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    content: {
      padding: spacing[4],
    },
    sectionTitle: {
      marginBottom: spacing[2],
      marginLeft: spacing[1],
    },
    card: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      ...shadows.sm,
      overflow: "hidden",
    },
    themeRow: {
      flexDirection: "row",
      gap: spacing[2],
      padding: spacing[4],
    },
    themeBtn: {
      flex: 1,
      alignItems: "center",
      gap: spacing[2],
      padding: spacing[3],
      borderRadius: radii.md,
      borderWidth: 2,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    themeBtnActive: {
      borderColor: t.brand.fg,
      backgroundColor: t.brand.tint,
    },
    themeBtnLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
    },
    themeBtnLabelActive: {
      color: t.brand.solidAlt,
    },
    hint: {
      textAlign: "center",
      marginTop: spacing[6],
    },
  });
}
