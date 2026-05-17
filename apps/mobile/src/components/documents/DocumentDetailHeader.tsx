import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { Document } from "@helu/api";
import { Typography, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue, DocumentCategoryTheme } from "@helu/ui";
import { DocumentCategoryIcon } from "./DocumentCategoryIcon";

interface DocumentDetailHeaderProps {
  document: Document;
  theme: DocumentCategoryTheme;
  subtitle?: string | null;
}

export function DocumentDetailHeader({ document, theme, subtitle }: DocumentDetailHeaderProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.root}>
      <DocumentCategoryIcon theme={theme} format={document.format} size={28} />
      <Typography variant="h2">{document.title}</Typography>
      {subtitle ? (
        <Typography variant="bodySm" color="secondary">
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );
}

function makeStyles(_t: ThemeContextValue) {
  return StyleSheet.create({
    root: {
      gap: spacing[3],
    },
  });
}
