import { useMemo } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import {
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  getDocumentFilterLabel,
  DOCUMENT_FILTER_KEYS,
  DatePicker,
  Button,
  todayISODate,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DocumentsFilterChip } from "./DocumentsFilterChip";
import { DocumentsTagFilterBuilder } from "./DocumentsTagFilterBuilder";
import {
  DOCUMENT_DATE_PRESETS,
  EMPTY_DOCUMENT_FILTERS,
  resolveDateRangeFromPreset,
  hasActiveDocumentFilters,
  type DocumentListFilters,
  type DocumentDatePreset,
  type TagCategoryOption,
} from "./utils/documentListFilters";

interface DocumentsFilterSheetProps {
  visible: boolean;
  draft: DocumentListFilters;
  onChangeDraft: (filters: DocumentListFilters) => void;
  onApply: () => void;
  onClose: () => void;
  tagCategories: TagCategoryOption[];
  tagsLoading?: boolean;
}

export function DocumentsFilterSheet({
  visible,
  draft,
  onChangeDraft,
  onApply,
  onClose,
  tagCategories,
  tagsLoading = false,
}: DocumentsFilterSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const patch = (partial: Partial<DocumentListFilters>) => {
    onChangeDraft({ ...draft, ...partial });
  };

  const handleDatePreset = (preset: DocumentDatePreset) => {
    if (preset === "custom") {
      const today = todayISODate();
      onChangeDraft({
        ...draft,
        datePreset: "custom",
        startDate: draft.startDate ?? today,
        endDate: draft.endDate ?? today,
      });
      return;
    }
    const range = resolveDateRangeFromPreset(preset);
    onChangeDraft({
      ...draft,
      datePreset: preset,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  const canClear = hasActiveDocumentFilters(draft);

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerSide}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver al listado"
          >
            <ChevronLeft size={24} color={t.text.primary} />
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={1}>
            Filtrar documentos
          </Text>

          <TouchableOpacity
            style={styles.headerSide}
            onPress={() => onChangeDraft(EMPTY_DOCUMENT_FILTERS)}
            disabled={!canClear}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros"
          >
            <Text style={[styles.clearText, !canClear && styles.clearTextDisabled]}>
              Limpiar filtros
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Categoría</Text>
          <View style={styles.chipGrid}>
            {DOCUMENT_FILTER_KEYS.map((key) => (
              <DocumentsFilterChip
                key={key ?? "all"}
                label={getDocumentFilterLabel(key)}
                selected={draft.category === key}
                onPress={() => patch({ category: key })}
              />
            ))}
          </View>

          <Text style={[styles.subtitle, styles.sectionGap]}>Fecha del documento</Text>
          <View style={styles.chipGrid}>
            {DOCUMENT_DATE_PRESETS.map((preset) => (
              <DocumentsFilterChip
                key={preset.id ?? "any-date"}
                label={preset.label}
                selected={draft.datePreset === preset.id}
                onPress={() => handleDatePreset(preset.id)}
              />
            ))}
          </View>

          {draft.datePreset === "custom" && (
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <DatePicker
                  label="Desde"
                  value={draft.startDate ?? ""}
                  onChange={(startDate) => patch({ startDate, datePreset: "custom" })}
                  maxDate={draft.endDate ?? todayISODate()}
                />
              </View>
              <View style={styles.dateField}>
                <DatePicker
                  label="Hasta"
                  value={draft.endDate ?? ""}
                  onChange={(endDate) => patch({ endDate, datePreset: "custom" })}
                  minDate={draft.startDate ?? undefined}
                  maxDate={todayISODate()}
                />
              </View>
            </View>
          )}

          <Text style={[styles.subtitle, styles.sectionGap]}>Etiquetas</Text>
          <DocumentsTagFilterBuilder
            key={visible ? "open" : "closed"}
            categories={tagCategories}
            tagFilters={draft.tagFilters}
            onChange={(tagFilters) => patch({ tagFilters })}
            loading={tagsLoading}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={onApply}>Aplicar filtros</Button>
        </View>
      </SafeAreaView>
    </RNModal>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
    headerSide: {
      width: 108,
      justifyContent: "center",
    },
    title: {
      flex: 1,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
      textAlign: "center",
    },
    clearText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
      textAlign: "right",
    },
    clearTextDisabled: {
      color: t.text.muted,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[5],
      paddingBottom: spacing[6],
    },
    subtitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      marginBottom: spacing[3],
    },
    sectionGap: {
      marginTop: spacing[5],
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    dateRow: {
      flexDirection: "row",
      gap: spacing[3],
      marginTop: spacing[3],
    },
    dateField: {
      flex: 1,
    },
    hint: {
      fontSize: fontSize.sm,
      color: t.text.muted,
      lineHeight: 20,
    },
    footer: {
      alignItems: "center",
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
      paddingBottom: spacing[4],
      borderTopWidth: 1,
      borderTopColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
  });
}
