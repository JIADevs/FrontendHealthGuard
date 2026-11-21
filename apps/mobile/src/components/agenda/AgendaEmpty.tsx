import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, Plus } from "lucide-react-native";
import {
  Button,
  Chip,
  IconTile,
  fontSize,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
  type Tone,
} from "@helu/ui";
import { Mascot, type MascotPose } from "../brand";

/**
 * Empty list of an agenda tab (m9 «Citas · vacío», «Medicamentos · vacío»): mascot, what will
 * appear here, one clear action, and an example of how it will look (principles 97 · 98 · 99).
 */
export function AgendaEmpty({
  pose,
  title,
  description,
  actionLabel,
  onAction,
  example,
}: {
  pose: MascotPose;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  example: { tone: Tone; icon: ReactNode; title: string; meta: string; trailing?: ReactNode };
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Mascot pose={pose} size={100} />
        <Text style={styles.h2} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.sub}>{description}</Text>
        <View style={styles.action}>
          <Button fullWidth icon={<Plus size={17} strokeWidth={2.6} color={t.text.onSolid} />} onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      </View>

      <View style={styles.example} accessible accessibilityLabel={`Ejemplo: ${example.title}, ${example.meta}`}>
        <View style={styles.exampleHead}>
          <Text style={styles.eyebrow}>Así se verá</Text>
          <Chip label="Ejemplo" tone="neutral" />
        </View>
        <View style={styles.exampleCard}>
          <IconTile tone={example.tone} icon={example.icon} />
          <View style={styles.copy}>
            <Text style={styles.rowTitle}>{example.title}</Text>
            <Text style={styles.meta}>{example.meta}</Text>
          </View>
          {example.trailing}
        </View>
      </View>
    </View>
  );
}

/**
 * m9 «Calendario · día sin eventos»: inside the screen, without the mascot, so the week stays in
 * view. Says what this day will show and offers to add something.
 */
export function EmptyDayCard({ weekday, onAdd }: { weekday: string; onAdd: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.dayCard}>
      <View style={styles.dayCopy}>
        <IconTile tone="neutral" size="lg" round icon={<CalendarDays size={24} strokeWidth={2.2} color={t.text.onMuted} />} />
        <Text style={styles.rowTitle}>Nada agendado este día</Text>
        <Text style={[styles.meta, styles.center]}>{`Aquí verás tus tomas, citas y tareas del ${weekday}.`}</Text>
      </View>
      <Button variant="secondary" fullWidth icon={<Plus size={16} strokeWidth={2.6} color={t.brand.text} />} onPress={onAdd}>
        Agregar a la agenda
      </Button>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: { gap: spacing[6], paddingTop: spacing[4], paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
    hero: { alignItems: "center", gap: 10, paddingHorizontal: spacing[3] },
    h2: { fontSize: 21, lineHeight: 26, fontFamily: nativeFont("heading", 900), color: t.text.primary, textAlign: "center" },
    sub: {
      maxWidth: 290,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: nativeFont("body", 400),
      color: t.text.secondary,
      textAlign: "center",
    },
    action: { width: 270, marginTop: 6 },
    example: { gap: spacing[2] },
    exampleHead: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    eyebrow: {
      flex: 1,
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    // Kit `example()`: dashed border, no edge, muted surface
    exampleCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[3],
      borderRadius: radii.card,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: t.border.default,
      backgroundColor: t.surface.muted,
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    rowTitle: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center", maxWidth: 250 },
    dayCard: {
      marginHorizontal: spacing[4],
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: radii.card,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    dayCopy: { alignItems: "center", gap: spacing[2], paddingVertical: spacing[2] },
  });
}
