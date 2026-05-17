import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Typography, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentsSectionHeaderProps {
  title: string;
}

export function DocumentsSectionHeader({ title }: DocumentsSectionHeaderProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.container}>
      <Typography variant="label" color="secondary">
        {title}
      </Typography>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[5],
      paddingBottom: spacing[2],
      backgroundColor: t.surface.bg,
    },
  });
}
