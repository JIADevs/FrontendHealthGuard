import { View, StyleSheet } from "react-native";
import { FileText, FileImage, File } from "lucide-react-native";
import { resolveDocTypeVariant, resolveDocFormat } from "./documentTypes";

export interface DocumentTypeIconProps {
  format: string;
  documentTypeName?: string;
  size?: number;
}

export function DocumentTypeIcon({ format, documentTypeName, size = 24 }: DocumentTypeIconProps) {
  const { bg, iconColor } = resolveDocTypeVariant(documentTypeName);
  const fmt = resolveDocFormat(format);

  const Icon = fmt === "image" ? FileImage : fmt === "pdf" ? FileText : File;
  const containerSize = size * 2;
  const borderRadius = containerSize * 0.25;

  return (
    <View
      style={[styles.container, { width: containerSize, height: containerSize, borderRadius, backgroundColor: bg }]}
      accessibilityLabel={documentTypeName ?? "Documento"}
    >
      <Icon size={size} color={iconColor} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
