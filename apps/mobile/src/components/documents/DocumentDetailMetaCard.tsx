import { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import type { Document } from "@helu/api";
import { formatFileKind, formatFileSize, fontSize, isLinkDocument, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentDetailMetaCardProps {
  document: Document;
}

export function DocumentDetailMetaCard({ document }: DocumentDetailMetaCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  if (isLinkDocument(document.kind)) {
    return <Text style={styles.text}>Resultado de examen virtual</Text>;
  }

  const label = `${formatFileKind(document.format ?? "")} · ${formatFileSize(document.fileSizeBytes)}`;

  return <Text style={styles.text}>{label}</Text>;
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    text: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
    },
  });
}
