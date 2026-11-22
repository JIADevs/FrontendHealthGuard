import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Filter } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  ChoiceChips,
  DatePicker,
  IconTile,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { CATEGORY_META, DOCUMENT_CATEGORIES, type DocumentCategory } from "./documentCategories";
import {
  EMPTY_DOCUMENT_FILTERS,
  sameDateRange,
  type DocumentListFilters,
  type TagCategoryOption,
} from "./utils/documentListFilters";

export interface DocumentsFilterSheetProps {
  initial: DocumentListFilters;
  tagCategories: TagCategoryOption[];
  /** Documents a draft would show among the loaded ones (category and tags only). */
  countFor: (draft: DocumentListFilters) => number;
  onApply: (filters: DocumentListFilters) => void;
  onClose: () => void;
}

/**
 * Mockup «Filtros»: «DOCUMENTOS · Filtros» with Categoría and Etiquetas as option chips, Fecha as
 * «Desde» / «Hasta», «Ver N documentos» and «Limpiar filtros». Nothing applies until «Ver».
 */
export function DocumentsFilterSheet({ initial, tagCategories, countFor, onApply, onClose }: DocumentsFilterSheetProps) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [draft, setDraft] = useState<DocumentListFilters>(initial);

  const tagOptions = useMemo(
    () => tagCategories.flatMap((cat) => cat.values.map((v) => ({ value: v.id, label: v.value }))),
    [tagCategories],
  );
  // The count is exact only while the date range is the one already loaded from the API.
  const count = sameDateRange(draft, initial) ? countFor(draft) : null;
  const seeLabel = count === null ? "Ver documentos" : count === 1 ? "Ver 1 documento" : `Ver ${count} documentos`;

  const apply = () => sheetRef.current?.close(() => onApply(draft));

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="DOCUMENTOS"
      title="Filtros"
      icon={<IconTile tone="neutral" size="lg" round icon={<Filter size={22} strokeWidth={2.4} color={t.text.onMuted} />} />}
      onClose={onClose}
    >
      <View style={styles.body}>
        <View style={styles.group}>
          <Text style={[styles.lbl, { color: t.text.primary }]}>Categoría</Text>
          <ChoiceChips
            multiple
            options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].plural }))}
            value={draft.categories}
            onChange={(next) => setDraft((d) => ({ ...d, categories: next as DocumentCategory[] }))}
          />
        </View>

        {tagOptions.length > 0 ? (
          <View style={styles.group}>
            <Text style={[styles.lbl, { color: t.text.primary }]}>Etiquetas</Text>
            <ChoiceChips
              multiple
              options={tagOptions}
              value={draft.tagValueIds}
              onChange={(next) => setDraft((d) => ({ ...d, tagValueIds: next }))}
            />
          </View>
        ) : null}

        <View style={styles.group}>
          <Text style={[styles.lbl, { color: t.text.primary }]}>Fecha</Text>
          <View style={styles.dates}>
            <View style={styles.date}>
              <DatePicker
                label="Desde"
                value={draft.startDate ?? ""}
                placeholder="Sin límite"
                maxDate={draft.endDate ?? undefined}
                onChange={(v) => setDraft((d) => ({ ...d, startDate: v || null }))}
              />
            </View>
            <View style={styles.date}>
              <DatePicker
                label="Hasta"
                value={draft.endDate ?? ""}
                placeholder="Hoy"
                minDate={draft.startDate ?? undefined}
                onChange={(v) => setDraft((d) => ({ ...d, endDate: v || null }))}
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button size="lg" fullWidth onPress={apply}>
            {seeLabel}
          </Button>
          <Button variant="ghost" fullWidth onPress={() => setDraft(EMPTY_DOCUMENT_FILTERS)}>
            Limpiar filtros
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[5] },
  group: { gap: spacing[2] },
  lbl: { fontSize: 13, fontFamily: nativeFont("heading", 800) },
  dates: { flexDirection: "row", gap: spacing[3] },
  date: { flex: 1 },
  actions: { gap: spacing[2] },
});
