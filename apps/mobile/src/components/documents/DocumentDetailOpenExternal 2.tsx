import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Button, spacing } from "@helu/ui";

interface DocumentDetailOpenExternalProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function DocumentDetailOpenExternal({
  onPress,
  disabled = false,
  loading = false,
}: DocumentDetailOpenExternalProps) {
  const styles = useMemo(() => makeStyles(), []);

  return (
    <View style={styles.wrap}>
      <Button
        variant="primary"
        fullWidth
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        accessibilityLabel="Abrir documento"
      >
        Abrir documento
      </Button>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing[1],
    },
  });
}
