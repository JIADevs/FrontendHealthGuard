import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Check } from "lucide-react-native";
import type { Document } from "@helu/api";
import { Chip, IconTile, PressableScale, fontSize, nativeFont, spacing, useAppTheme, useConfirmBounce, type ThemeContextValue } from "@helu/ui";
import { CATEGORY_META, categoryOf } from "./documentCategories";
import { documentDateLabel } from "./utils/groupDocumentsByDate";

/**
 * Mockup helper `pickDoc` (Nueva mochila, Agregar documentos, Compartir · Elegir documentos): a tight
 * card with the category tile, the title on two lines and the date, and on the right a 24 px square
 * that turns into a blue check. Documents that cannot be picked show a grey chip instead
 * («Ya en la mochila»). The whole card is the touch target.
 */
export function SelectableDocumentRow({
  document,
  selected,
  onToggle,
  lockedLabel,
}: {
  document: Document;
  selected: boolean;
  onToggle: () => void;
  /** Shown instead of the square when the document is already there; the row is then disabled. */
  lockedLabel?: string;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const category = CATEGORY_META[categoryOf(document)];
  const Icon = category.icon;
  const date = documentDateLabel(document);
  // §5: selecting bounces the check.
  const bounce = useConfirmBounce(selected);
  const locked = !!lockedLabel;

  return (
    <PressableScale
      onPress={onToggle}
      disabled={locked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: locked }}
      accessibilityLabel={`${document.title}, ${date}${locked ? `, ${lockedLabel}` : ""}`}
      style={[styles.card, selected && { borderColor: t.brand.focus }]}
    >
      <IconTile tone="document" icon={<Icon size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {document.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {date}
        </Text>
      </View>
      {locked ? (
        <Chip label={lockedLabel} tone="neutral" />
      ) : (
        <Animated.View
          style={[
            styles.box,
            selected ? { backgroundColor: t.brand.solid, borderColor: t.brand.solid } : { borderColor: t.border.medium },
            bounce,
          ]}
        >
          {selected ? <Check size={14} strokeWidth={3} color={t.text.onSolid} /> : null}
        </Animated.View>
      )}
    </PressableScale>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.card.tight`
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  });
}
