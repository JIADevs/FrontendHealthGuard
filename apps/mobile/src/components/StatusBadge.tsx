import { View, Text, StyleSheet } from "react-native";
import { spacing, colors } from "@helu/ui";
import { STATUS_COLORS } from "../constants/appointments";

interface StatusBadgeProps {
  status: string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const backgroundColor = STATUS_COLORS[status] || colors.primary[500];

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 16,
  },
  text: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
});
