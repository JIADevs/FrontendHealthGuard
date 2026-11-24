import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, type LucideIcon } from "lucide-react-native";
import { IconTile, PressableScale, fontSize, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";

/**
 * A section of the treatment detail (kit `tsec`): gray 32 px tile, the title and, when the app can
 * create that kind of item, «+ Agregar» with a 44 px touch area. Gray everywhere (v2.1 «Menos color»).
 */
export function TreatmentSection({
  title,
  icon: Icon,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  icon: LucideIcon;
  /** Screen reader label of «+ Agregar», e.g. «Agregar medicamento». */
  addLabel?: string;
  onAdd?: () => void;
  children?: ReactNode;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headTile} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon size={17} strokeWidth={2.2} color={t.text.onMuted} />
        </View>
        <Text style={styles.h3} accessibilityRole="header">
          {title}
        </Text>
        {onAdd ? <AddLink label="Agregar" accessibilityLabel={addLabel} onPress={onAdd} icon /> : null}
      </View>
      {children}
    </View>
  );
}

/** Kit `.link` (Nunito 800 13, brand): text action with a 44 px touch area, optional «+». */
export function AddLink({
  label,
  accessibilityLabel,
  onPress,
  icon = false,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  icon?: boolean;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      {icon ? <Plus size={14} strokeWidth={2.6} color={t.brand.text} /> : null}
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

/** A row inside a section (kit `row('gray', …)`): gray tile, title on up to two lines and the meta line. */
export function TreatmentRow({
  icon: Icon,
  title,
  meta,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  meta?: string;
  /** Opens the item (cycle, appointment, document). Check-ins and symptoms have no screen of their own. */
  onPress?: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const content = (
    <View style={styles.row}>
      <IconTile tone="neutral" icon={<Icon size={19} strokeWidth={2.2} color={t.text.onMuted} />} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={meta ? `${title}, ${meta}` : title}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={meta ? `${title}, ${meta}` : title}>
      {content}
    </PressableScale>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.card.tight`
    card: {
      gap: 10,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    head: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44 },
    headTile: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.muted,
    },
    h3: { flex: 1, fontSize: fontSize.md, lineHeight: 20, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    link: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 },
    pressed: { opacity: 0.6 },
    linkText: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.text },
    // 40 px tile and 2 px above and below: every tappable row is at least 44 px.
    row: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44, paddingVertical: 2 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
