import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react-native";
import {
  palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  addTagFilter,
  removeTagFilter,
  type DocumentTagFilter,
  type TagCategoryOption,
} from "./utils/documentListFilters";

interface DocumentsTagFilterBuilderProps {
  categories: TagCategoryOption[];
  tagFilters: DocumentTagFilter[];
  onChange: (filters: DocumentTagFilter[]) => void;
  loading?: boolean;
}

export function DocumentsTagFilterBuilder({
  categories,
  tagFilters,
  onChange,
  loading = false,
}: DocumentsTagFilterBuilderProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [browsingCategoryId, setBrowsingCategoryId] = useState<string | null>(null);

  const browsingCategory = categories.find((c) => c.id === browsingCategoryId);

  const selectedValueIds = useMemo(
    () => new Set(tagFilters.map((f) => f.valueId)),
    [tagFilters],
  );

  const handleSelectValue = (category: TagCategoryOption, value: { id: string; value: string }) => {
    if (selectedValueIds.has(value.id)) {
      onChange(removeTagFilter(tagFilters, value.id));
    } else {
      onChange(
        addTagFilter(tagFilters, {
          categoryId: category.id,
          categoryName: category.name,
          valueId: value.id,
          valueLabel: value.value,
        }),
      );
    }
  };

  if (loading) {
    return <Text style={styles.hint}>Cargando etiquetas…</Text>;
  }

  if (categories.length === 0) {
    return (
      <Text style={styles.hint}>
        Aún no tienes etiquetas. Puedes agregarlas al editar un documento.
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      {tagFilters.length > 0 && (
        <View style={styles.activeBlock}>
          <Text style={styles.activeLabel}>Filtros activos</Text>
          <View style={styles.tokenRow}>
            {tagFilters.map((f) => (
              <View key={f.valueId} style={styles.token}>
                <Text style={styles.tokenText} numberOfLines={1}>
                  <Text style={styles.tokenCategory}>{f.categoryName}: </Text>
                  {f.valueLabel}
                </Text>
                <TouchableOpacity
                  onPress={() => onChange(removeTagFilter(tagFilters, f.valueId))}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar filtro ${f.categoryName} ${f.valueLabel}`}
                >
                  <X size={14} color={palette.brand[700]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {browsingCategory ? (
        <View>
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => setBrowsingCategoryId(null)}
            accessibilityRole="button"
            accessibilityLabel="Volver a categorías de etiquetas"
          >
            <ChevronLeft size={18} color={t.brand.fg} />
            <Text style={styles.backText}>{browsingCategory.name}</Text>
          </TouchableOpacity>

          {browsingCategory.values.length === 0 ? (
            <Text style={styles.hint}>Esta categoría no tiene valores.</Text>
          ) : (
            <View style={styles.list}>
              {browsingCategory.values.map((value) => {
                const selected = selectedValueIds.has(value.id);
                return (
                  <TouchableOpacity
                    key={value.id}
                    style={[styles.listRow, selected && styles.listRowSelected]}
                    onPress={() => handleSelectValue(browsingCategory, value)}
                    activeOpacity={0.65}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${browsingCategory.name} ${value.value}`}
                  >
                    <Text style={[styles.listLabel, selected && styles.listLabelSelected]}>
                      {value.value}
                    </Text>
                    {selected ? (
                      <Check size={18} color={palette.brand[600]} strokeWidth={2.5} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      ) : (
        <View>
          <Text style={styles.stepHint}>Elige una categoría y luego sus valores</Text>
          <View style={styles.list}>
            {categories.map((category) => {
              const countInCategory = tagFilters.filter((f) => f.categoryId === category.id).length;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.listRow}
                  onPress={() => setBrowsingCategoryId(category.id)}
                  activeOpacity={0.65}
                  accessibilityRole="button"
                  accessibilityLabel={`Categoría ${category.name}`}
                >
                  <View style={styles.categoryLeading}>
                    <Text style={styles.listLabel}>{category.name}</Text>
                    {countInCategory > 0 ? (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{countInCategory}</Text>
                      </View>
                    ) : null}
                  </View>
                  <ChevronRight size={18} color={t.text.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    root: {
      gap: spacing[3],
    },
    hint: {
      fontSize: fontSize.sm,
      color: t.text.muted,
      lineHeight: 20,
    },
    stepHint: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
      marginBottom: spacing[2],
    },
    activeBlock: {
      gap: spacing[2],
      marginBottom: spacing[2],
    },
    activeLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    tokenRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    token: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      maxWidth: "100%",
      paddingVertical: spacing[1],
      paddingLeft: spacing[3],
      paddingRight: spacing[2],
      borderRadius: radii.full,
      backgroundColor: palette.brand[50],
      borderWidth: 1,
      borderColor: palette.brand[200],
    },
    tokenText: {
      fontSize: fontSize.sm,
      color: palette.brand[800],
      flexShrink: 1,
    },
    tokenCategory: {
      fontWeight: fontWeight.semibold,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      marginBottom: spacing[2],
      paddingVertical: spacing[1],
    },
    backText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
    },
    list: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      overflow: "hidden",
      backgroundColor: t.surface.bgCard,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border.light,
    },
    listRowSelected: {
      backgroundColor: palette.brand[50],
    },
    categoryLeading: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      flex: 1,
    },
    listLabel: {
      fontSize: fontSize.base,
      color: t.text.primary,
    },
    listLabelSelected: {
      fontWeight: fontWeight.semibold,
      color: palette.brand[700],
    },
    countBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: radii.full,
      backgroundColor: palette.brand[500],
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing[1],
    },
    countText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: t.surface.bgCard,
    },
  });
}
