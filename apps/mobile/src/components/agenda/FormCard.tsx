import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { fontSize, nativeFont, radii, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";

/**
 * Section card of the agenda forms (mockups «Nueva cita», «Nuevo medicamento», «Nueva tarea»):
 * radius 18, 1 px border with the 4 px bottom edge (MASTER §6–7) and an H3 title.
 */
export function FormCard({
  title,
  hint,
  children,
  onLayout,
}: {
  title: string;
  /** Muted text after the title, e.g. «(opcional)» */
  hint?: string;
  children: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.card} onLayout={onLayout}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
        {hint ? <Text style={styles.hint}> {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

/** Standalone field label (formularios.md §2: Nunito 800 13), for chips and other non-input fields. */
export function FormLabel({ children }: { children: string }) {
  const t = useAppTheme();
  return (
    <Text style={{ fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary }}>{children}</Text>
  );
}

/** Kit `.more`: dashed row that folds the optional fields («Más detalles (opcional)»). */
export function MoreDetailsToggle({
  title,
  hint,
  open,
  onToggle,
}: {
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const Icon = open ? ChevronUp : ChevronDown;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onToggle}
      style={({ pressed }) => [styles.more, pressed && { backgroundColor: t.surface.muted }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.moreTitle}>{title}</Text>
        <Text style={styles.moreHint}>{hint}</Text>
      </View>
      <Icon size={18} strokeWidth={2.4} color={t.brand.solid} />
    </Pressable>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.card,
      padding: spacing[4],
      gap: spacing[3],
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
    },
    title: { fontSize: fontSize.md, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    hint: { fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    more: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      minHeight: 48,
      paddingVertical: spacing[3],
      paddingHorizontal: 14,
      borderRadius: radii.input,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: t.border.default,
    },
    moreTitle: { fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.brand.text },
    moreHint: { fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
