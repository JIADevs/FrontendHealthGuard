import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { spacing, useAppTheme } from "@helu/ui";
import { ChevronRight } from "lucide-react-native";

interface FormSelectorProps {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
}

export function FormSelector({ label, value, placeholder, onPress }: FormSelectorProps) {
  const t = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: t.text.primary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: t.surface.bgCard, borderColor: t.border.medium }]}
        onPress={onPress}
      >
        <Text style={[styles.text, { color: value ? t.text.primary : t.text.tertiary }]}>
          {value || placeholder}
        </Text>
        <ChevronRight size={20} color={t.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  text: {
    fontSize: 16,
  },
});