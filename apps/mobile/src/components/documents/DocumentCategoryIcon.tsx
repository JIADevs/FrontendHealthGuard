import { View, StyleSheet } from "react-native";
import {
  FileText,
  FileImage,
  Heart,
  Pill,
  Syringe,
  FlaskConical,
} from "lucide-react-native";
import type { DocumentCategoryKey } from "@helu/ui";
import { resolveDocFormat } from "@helu/ui";
import type { DocumentCategoryTheme } from "@helu/ui";

interface DocumentCategoryIconProps {
  theme: DocumentCategoryTheme;
  format?: string | null;
  size?: number;
}

export function DocumentCategoryIcon({ theme, format, size = 20 }: DocumentCategoryIconProps) {
  const Icon = pickIcon(theme.key, format);
  const containerSize = size * 2;
  const borderRadius = radiiFromSize(containerSize);

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor: theme.bg,
        },
      ]}
    >
      <Icon size={size} color={theme.iconColor} strokeWidth={2} />
    </View>
  );
}

function pickIcon(key: DocumentCategoryKey, format?: string | null) {
  switch (key) {
    case "cardiology":
      return Heart;
    case "formula":
      return Pill;
    case "vaccine":
      return Syringe;
    case "laboratory":
      return FlaskConical;
    case "imaging":
      return resolveDocFormat(format) === "image" ? FileImage : FileText;
    default:
      return resolveDocFormat(format) === "image" ? FileImage : FileText;
  }
}

function radiiFromSize(size: number) {
  return Math.round(size * 0.28);
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
