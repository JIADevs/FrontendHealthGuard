import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, FileText, Plus, X } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  IconTile,
  TextField,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
  type Tone,
} from "@helu/ui";

/**
 * Linking documents and backpacks in the agenda forms («Nueva cita · más detalles», «Nueva tarea»):
 * the «Agregar …» row, the removable chip of each chosen item, and the multi-select sheet.
 */

// ─── Chip picker modal (multi-select) ─────────────────────────────────────────

export interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; label: string; sub?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function PickerModal({ visible, onClose, title, items, selected, onToggle }: PickerModalProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makePickerStyles(t), [t]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!visible) setSearch("");
  }, [visible]);

  if (!visible) return null;

  const filtered = search.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  // v2: selección múltiple en la hoja compartida (formularios.md §4: fila seleccionable con casilla).
  return (
    <BottomSheet title={title} onClose={onClose}>
      <TextField label="Buscar" value={search} onChange={setSearch} placeholder="Escribe un nombre" autoCapitalize="none" />
      <View style={styles.pickerList}>
        {filtered.length === 0 && <Text style={styles.emptyText}>No hay elementos para elegir</Text>}
        {filtered.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.pickerRow, isSelected && styles.pickerRowSelected, pressed && { opacity: 0.8 }]}
              onPress={() => onToggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={item.sub ? `${item.label}, ${item.sub}` : item.label}
            >
              <View style={styles.pickerRowCopy}>
                <Text style={styles.pickerRowTitle} numberOfLines={2}>{item.label}</Text>
                {item.sub ? <Text style={styles.pickerRowSub} numberOfLines={2}>{item.sub}</Text> : null}
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                {isSelected ? <Check size={16} strokeWidth={3} color={t.text.onSolid} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.pickerFooter}>
        <Button fullWidth onPress={onClose}>
          {selected.length === 0 ? "Listo" : selected.length === 1 ? "Listo · 1 elegido" : `Listo · ${selected.length} elegidos`}
        </Button>
      </View>
    </BottomSheet>
  );
}


// ─── Chip tag ──────────────────────────────────────────────────────────────────

export function ChipTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  const t = useAppTheme();
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: spacing[1],
      backgroundColor: t.brand.tint, borderRadius: radii.full, paddingLeft: spacing[3],
      borderWidth: 1, borderColor: t.brand.tintBorder, minHeight: 44,
    }}>
      <Text style={{ fontSize: 13, color: t.brand.text, fontFamily: nativeFont("heading", 800) }}>{label}</Text>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${label}`}
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <X size={14} color={t.brand.text} />
      </Pressable>
    </View>
  );
}

/** Fila «Agregar …» del mockup: cuadro del módulo, texto y «+» azul. */
export function AddRow({ tone, icon: Icon, label, onPress }: { tone: Tone; icon: typeof FileText; label: string; onPress: () => void }) {
  const t = useAppTheme();
  const color = tone === "document" ? t.accent.docFg : t.accent.backpackFg;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44, opacity: pressed ? 0.7 : 1 })}
    >
      <IconTile tone={tone} icon={<Icon size={19} strokeWidth={2.2} color={color} />} />
      <Text style={{ flex: 1, fontSize: 14, fontFamily: nativeFont("body", 600), color: t.text.primary }}>{label}</Text>
      <Plus size={18} color={t.brand.solid} />
    </Pressable>
  );
}

function makePickerStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    pickerList: { gap: spacing[2], marginTop: spacing[3] },
    pickerRow: {
      flexDirection: "row", alignItems: "center", gap: spacing[3],
      minHeight: 56, padding: spacing[3],
      borderRadius: radii.input, borderWidth: 1.5, borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    pickerRowSelected: { borderColor: t.brand.solid, backgroundColor: t.brand.tint },
    pickerRowCopy: { flex: 1, gap: 2 },
    pickerRowTitle: { fontSize: 14, color: t.text.primary, fontFamily: nativeFont("body", 600) },
    pickerRowSub: { fontSize: 13, color: t.text.secondary, fontFamily: nativeFont("body", 400) },
    // formularios.md: casilla de 24 px con radio 8
    checkbox: {
      width: 24, height: 24, borderRadius: radii.sm, borderWidth: 1.5, borderColor: t.border.default,
      alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bgCard,
    },
    checkboxOn: { backgroundColor: t.brand.solid, borderColor: t.brand.solid },
    pickerFooter: { marginTop: spacing[4] },
    emptyText: { fontSize: 14, color: t.text.secondary, textAlign: "center", paddingVertical: spacing[6], fontFamily: nativeFont("body", 400) },
  });
}
