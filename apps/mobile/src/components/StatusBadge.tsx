import { View, Text, StyleSheet } from "react-native";
import { spacing } from "@helu/ui";
import { STATUS_COLORS } from "../constants/appointments";

interface StatusBadgeProps {
  status: string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const backgroundColor = STATUS_COLORS[status] || "#3B82F6";

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
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});