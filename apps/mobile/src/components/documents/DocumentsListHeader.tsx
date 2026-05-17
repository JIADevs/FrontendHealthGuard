import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Typography, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentsListHeaderProps {
  totalCount: number;
}

export function DocumentsListHeader({ totalCount }: DocumentsListHeaderProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const label = totalCount === 1 ? "1 archivo" : `${totalCount} archivos`;

  return (
    <View style={styles.row}>
      <Typography variant="h2">Documentos</Typography>
      <Typography variant="bodySm" color="secondary">
        {label}
      </Typography>
    </View>
  );
}

function makeStyles(_t: ThemeContextValue) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
  });
}
