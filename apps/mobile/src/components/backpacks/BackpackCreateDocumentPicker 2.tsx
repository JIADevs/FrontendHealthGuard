import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { Document } from "@helu/api";
import {
  Typography,
  spacing,
  radii,
  fontSize,
  fontWeight,
  Checkbox,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DocumentCategoryIcon } from "../documents/DocumentCategoryIcon";
import { resolveDocumentTheme } from "../documents/utils/resolveDocumentTheme";
import { formatShortDate } from "@helu/ui";

interface BackpackCreateDocumentPickerProps {
  documents: Document[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  loading?: boolean;
}

export function BackpackCreateDocumentPicker({
  documents,
  selectedIds,
  onToggle,
  loading = false,
}: BackpackCreateDocumentPickerProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const selectedCount = selectedIds.size;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>SELECCIONAR DOCUMENTOS</Text>

      {loading ? (
        <ActivityIndicator color={t.brand.fg} style={{ marginVertical: spacing[6] }} />
      ) : documents.length === 0 ? (
        <Typography variant="bodySm" color="secondary">
          No tienes documentos disponibles para agregar.
        </Typography>
      ) : (
        <View style={styles.list}>
          {documents.map((doc) => {
            const checked = selectedIds.has(doc.id);
            const category = resolveDocumentTheme(doc, t);
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.row, checked && styles.rowSelected]}
                onPress={() => onToggle(doc.id)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <View pointerEvents="none">
                  <Checkbox checked={checked} onChange={() => {}} />
                </View>
                <DocumentCategoryIcon theme={category} format={doc.format} size={18} />
                <View style={styles.info}>
                  <Typography variant="label" numberOfLines={1}>
                    {doc.title}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {formatShortDate(doc.documentDate ?? doc.uploadedAt)}
                  </Typography>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.counter}>
        {selectedCount} de {documents.length} seleccionados
      </Text>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    section: {
      gap: spacing[3],
    },
    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      letterSpacing: 0.6,
    },
    list: {
      gap: spacing[2],
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[3],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
    rowSelected: {
      borderColor: t.brand.tintBorder,
      backgroundColor: t.brand.tint,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    counter: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
      textAlign: "center",
      marginTop: spacing[2],
    },
  });
}
