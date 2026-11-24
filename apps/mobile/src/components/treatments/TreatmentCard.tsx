import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Activity } from "lucide-react-native";
import type { Treatment } from "@helu/api";
import {
  Chip,
  IconTile,
  PressableScale,
  Skeleton,
  fontSize,
  motion,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  useHighlight,
  type ThemeContextValue,
} from "@helu/ui";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { treatmentSinceLabel } from "./treatmentFormat";

export interface TreatmentCardProps {
  treatment: Treatment;
  onPress: () => void;
  /** What it groups («Metformina», «3 documentos»), from its detail; empty when there is nothing or it failed. */
  chips?: string[];
  /** Its detail has not arrived yet: the chips wait as two gray pills. */
  chipsLoading?: boolean;
}

/**
 * Mockup «Tratamientos» (kit `tcard`): violet tile with the pulse, the name, «Desde 10 oct» and gray
 * chips with what it groups («Metformina», «3 documentos», «4 citas»). The whole card opens the
 * detail. No status chip: the tab already says it.
 *
 * The list API has no counts: `Treatments` reads each treatment's detail (two at a time) and passes
 * the chips. While they load they wait as two gray pills; if the detail fails, the card stays as it
 * is, without chips.
 */
export function TreatmentCard({ treatment, onPress, chips = [], chipsLoading = false }: TreatmentCardProps) {
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

  const label = [treatment.name, since, ...chips].filter(Boolean).join(", ");

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.card}>
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
      {chipsLoading ? (
        // §6c: the shape of what arrives. Most treatments group something, so the pills keep the
        // card from growing under the person's finger when the chips land.
        <View style={styles.chips} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Skeleton width={92} height={CHIP_HEIGHT} radius={radii.full} />
          <Skeleton width={72} height={CHIP_HEIGHT} radius={radii.full} />
        </View>
      ) : chips.length > 0 ? (
        <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.chips} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {chips.map((chip) => (
            <Chip key={chip} label={chip} tone="neutral" />
          ))}
        </Animated.View>
      ) : null}
      <Animated.View pointerEvents="none" style={highlight} />
    </PressableScale>
  );
}

/** Kit `chip`: 12.5 px label with 5 px above and below. */
const CHIP_HEIGHT = 26;

/** A card while the list loads (§6c, inside the list's `SkeletonGroup`): tile, two lines and two chips. */
export function TreatmentCardSkeleton() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={40} height={40} radius={13} />
        <View style={[styles.copy, styles.skeletonLines]}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
      <View style={styles.chips}>
        <Skeleton width={92} height={CHIP_HEIGHT} radius={radii.full} />
        <Skeleton width={72} height={CHIP_HEIGHT} radius={radii.full} />
      </View>
    </View>
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
    // Kit `row g8 wrap` under the header row, from the card's left edge.
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginTop: spacing[3] },
    skeletonLines: { gap: 8 },
  });
}
