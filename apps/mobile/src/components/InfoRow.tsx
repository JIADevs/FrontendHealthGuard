import { View, Text, StyleSheet } from "react-native";
import { spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { ReactNode } from "react";

interface InfoRowProps {
  icon?: ReactNode;
  label: string;
  value?: string;
  children?: ReactNode;
}

export function InfoRow({ icon, label, value, children }: InfoRowProps) {
  const t = useAppTheme();
  const styles = makeStyles(t);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        {value && <Text style={styles.value}>{value}</Text>}
        {children}
      </View>
    </View>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    container: {
      gap: spacing[2],
    },
    label: {
      fontSize: 12,
      fontWeight: "400",
      color: t.text.secondary,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    icon: {
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    value: {
      fontSize: 16,
      color: t.text.primary,
      flex: 1,
    },
  });