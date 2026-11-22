import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Plus, Tag } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  ChoiceChips,
  IconTile,
  TextField,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import type { TagCategoryOut } from "@helu/api";

/**
 * «+ Agregar» under «Etiquetas (opcional)»: each tag category with its values as option chips, and a
 * field to add a new value to that category. Chips apply at once; «Listo» closes the sheet.
 */
export function TagPickerSheet({
  categories,
  selected,
  onChange,
  onAddValue,
  addingCategoryId,
  onClose,
}: {
  categories: TagCategoryOut[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onAddValue: (categoryId: string, value: string) => Promise<void>;
  addingCategoryId: string | null;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="DOCUMENTO"
      title="Etiquetas"
      icon={<IconTile tone="neutral" size="lg" round icon={<Tag size={22} strokeWidth={2.4} color={t.text.onMuted} />} />}
      onClose={onClose}
    >
      <View style={styles.body}>
        {categories.map((cat) => {
          const ids = (cat.values ?? []).map((v) => v.id);
          const draft = drafts[cat.id] ?? "";
          return (
            <View key={cat.id} style={styles.group}>
              <Text style={[styles.lbl, { color: t.text.primary }]}>{cat.name}</Text>
              {ids.length > 0 ? (
                <ChoiceChips
                  multiple
                  options={(cat.values ?? []).map((v) => ({ value: v.id, label: v.value }))}
                  value={selected.filter((id) => ids.includes(id))}
                  onChange={(next) => onChange([...selected.filter((id) => !ids.includes(id)), ...next])}
                />
              ) : null}
              <View style={styles.addRow}>
                <View style={styles.addField}>
                  <TextField
                    value={draft}
                    onChange={(v) => setDrafts((d) => ({ ...d, [cat.id]: v }))}
                    placeholder={`Nuevo en «${cat.name}»`}
                    accessibilityLabel={`Nueva etiqueta en ${cat.name}`}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (!draft.trim()) return;
                      void onAddValue(cat.id, draft).then(() => setDrafts((d) => ({ ...d, [cat.id]: "" })));
                    }}
                  />
                </View>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={15} strokeWidth={2.6} color={t.brand.text} />}
                  loading={addingCategoryId === cat.id}
                  loadingLabel="Agregando…"
                  disabled={!draft.trim() || addingCategoryId !== null}
                  onPress={() => void onAddValue(cat.id, draft).then(() => setDrafts((d) => ({ ...d, [cat.id]: "" })))}
                >
                  Agregar
                </Button>
              </View>
            </View>
          );
        })}
        <Button size="lg" fullWidth onPress={() => sheetRef.current?.close()}>
          Listo
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[5] },
  group: { gap: spacing[2] },
  lbl: { fontSize: 13, fontFamily: nativeFont("heading", 800) },
  addRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  addField: { flex: 1 },
});
