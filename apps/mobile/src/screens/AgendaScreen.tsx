import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, fontWeight, useAppTheme } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";

export function AgendaScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Módulo de Agenda en construcción para Mobile</Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    header:    { padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    title:     { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary },
    content:   { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing[6] },
    text:      { color: t.text.secondary, textAlign: "center" },
  });
}
