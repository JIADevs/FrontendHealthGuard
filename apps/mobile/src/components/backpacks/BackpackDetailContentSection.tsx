import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Plus } from "lucide-react-native";
import type { Document } from "@helu/api";
import {
  Button,
  Typography,
  spacing,
  radii,
  fontSize,
  fontWeight,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { BackpackDetailDocumentItem } from "./BackpackDetailDocumentItem";

interface BackpackDetailContentSectionProps {
  documents: Document[];
  onDocumentPress: (doc: Document) => void;
  onAddPress: () => void;
  onRemoveDocument?: (doc: Document) => void;
  removingDocId?: string | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
}

export function BackpackDetailContentSection({
  documents,
  onDocumentPress,
  onAddPress,
  onRemoveDocument,
  removingDocId = null,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  emptyMessage = "Todavía no hay documentos en esta mochila.",
}: BackpackDetailContentSectionProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>CONTENIDO</Text>

      {documents.length === 0 ? (
        <Typography variant="bodySm" color="secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <View style={styles.list}>
          {documents.map((doc) => (
            <BackpackDetailDocumentItem
              key={doc.id}
              document={doc}
              onPress={() => onDocumentPress(doc)}
              onRemove={onRemoveDocument ? () => onRemoveDocument(doc) : undefined}
              isRemoving={removingDocId === doc.id}
            />
          ))}
        </View>
      )}

      {isFetchingNextPage ? (
        <ActivityIndicator color={t.brand.fg} style={styles.footerLoader} />
      ) : null}

      {hasNextPage && onLoadMore ? (
        <Button variant="secondary" fullWidth onPress={onLoadMore}>
          Cargar más documentos
        </Button>
      ) : null}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={onAddPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Agregar documento a la mochila"
      >
        <Plus size={18} color={t.brand.fg} strokeWidth={2.5} />
        <Text style={styles.addBtnText}>Agregar documento</Text>
      </TouchableOpacity>
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
      gap: spacing[3],
    },
    footerLoader: {
      marginVertical: spacing[2],
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      paddingVertical: spacing[3],
      borderRadius: radii.lg,
      borderWidth: 1.5,
      borderColor: t.brand.fg,
      backgroundColor: t.surface.bgCard,
    },
    addBtnText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
    },
  });
}
