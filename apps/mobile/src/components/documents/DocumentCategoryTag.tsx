import { View, Text, StyleSheet } from "react-native";
import { fontSize, fontWeight, radii, spacing } from "@helu/ui";
import type { DocumentCategoryTheme } from "@helu/ui";

interface DocumentCategoryTagProps {
  theme: DocumentCategoryTheme;
}

export function DocumentCategoryTag({ theme }: DocumentCategoryTagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: theme.tagBg }]}>
      <Text style={[styles.text, { color: theme.tagText }]}>{theme.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
