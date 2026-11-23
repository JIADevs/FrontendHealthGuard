import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Activity } from "lucide-react-native";
import type { Treatment } from "@helu/api";
import { IconTile, PressableScale, fontSize, nativeFont, spacing, useAppTheme, useHighlight, type ThemeContextValue } from "@helu/ui";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { treatmentSinceLabel } from "./treatmentFormat";

export interface TreatmentCardProps {
  treatment: Treatment;
  onPress: () => void;
}

/**
 * Mockup «Tratamientos» (kit `tcard`): violet tile with the pulse, the name and «Desde 10 oct». The whole
 * card opens the detail. No status chip (the tab already says it) and no counts: the list API has
 * none (decision 8).
 */
export function TreatmentCard({ treatment, onPress }: TreatmentCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const since = treatmentSinceLabel(treatment);

  // Just created or edited: blue border that fades in 1.2 s (movimiento-interacciones.md §6).
  const justSaved = useRecentlySaved((s) => s.treatmentId === treatment.id);
  const highlight = useHighlight(justSaved);
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => useRecentlySaved.getState().clearTreatment(), 1300);
    return () => clearTimeout(timer);
  }, [justSaved]);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={since ? `${treatment.name}, ${since}` : treatment.name}
      style={styles.card}
    >
      <View style={styles.row}>
        <IconTile tone="treatment" icon={<Activity size={19} strokeWidth={2.2} color={t.accent.treatmentFg} />} />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {treatment.name}
          </Text>
          {since ? (
            <Text style={styles.meta} numberOfLines={1}>
              {since}
            </Text>
          ) : null}
        </View>
      </View>
      <Animated.View pointerEvents="none" style={highlight} />
    </PressableScale>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.card.tight`
    card: {
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
