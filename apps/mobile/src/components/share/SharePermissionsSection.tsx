import { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Eye } from "lucide-react-native";
import { Typography, spacing, radii, fontSize, fontWeight, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export function SharePermissionsSection() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>PERMISOS</Text>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Eye size={18} color={t.brand.fg} strokeWidth={2} />
        </View>
        <View style={styles.copy}>
          <Typography variant="label">Ver</Typography>
          <Typography variant="caption" color="secondary">
            Siempre permitido · solo visualización
          </Typography>
        </View>
        <Text style={styles.badge}>Activo</Text>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: {
      gap: spacing[2],
    },
    sectionLabel: {
      letterSpacing: 0.6,
      fontWeight: fontWeight.semibold,
      fontSize: fontSize.xs,
      color: t.text.secondary,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.md,
      backgroundColor: t.brand.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    badge: {
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      fontSize: fontSize.xs,
    },
  });
}
