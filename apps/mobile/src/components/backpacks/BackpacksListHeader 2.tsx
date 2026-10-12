import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "@helu/ui";

interface BackpacksListHeaderProps {
  totalCount: number;
}

export function BackpacksListHeader({ totalCount }: BackpacksListHeaderProps) {
  const styles = useMemo(() => makeStyles(), []);
  const label =
    totalCount === 1 ? "1 mochila" : `${totalCount} mochilas`;

  return (
    <View style={styles.row}>
      <Typography variant="h2">Mochilas</Typography>
      <Typography variant="bodySm" color="secondary">
        {label}
      </Typography>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
  });
}
