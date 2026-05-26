import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SearchField, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface BackpacksSearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
}

export function BackpacksSearchToolbar({ value, onChange }: BackpacksSearchToolbarProps) {
  const styles = useMemo(() => makeStyles(), []);

  return (
    <View style={styles.row}>
      <SearchField
        value={value}
        onChange={onChange}
        placeholder="Buscar por nombre..."
        accessibilityLabel="Buscar mochilas"
      />
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    row: {
      marginTop: spacing[4],
    },
  });
}
