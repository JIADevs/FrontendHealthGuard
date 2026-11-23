import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Activity } from "lucide-react-native";
import type { Treatment } from "@helu/api";
import { Chip, IconTile, Skeleton, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { TREATMENT_STATUS, treatmentSubtitle } from "./treatmentFormat";

/**
 * Top of «Detalle de tratamiento»: the large violet tile the list card had (continuity, §3), the name,
 * «Inicio 10 oct · En curso» and the status chip; the description below when there is one.
 * `justCreated` (m9 «recién creado»): «Creado hoy» and no chip.
 */
export function TreatmentSummaryCard({ treatment, justCreated = false }: { treatment: Treatment; justCreated?: boolean }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const status = TREATMENT_STATUS[treatment.status];
  const subtitle = justCreated ? "Creado hoy" : treatmentSubtitle(treatment);
  const description = treatment.description?.trim();
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <IconTile tone="treatment" size="lg" icon={<Activity size={24} strokeWidth={2.2} color={t.accent.treatmentFg} />} />
        <View style={styles.copy}>
          <Text style={styles.h2} accessibilityRole="header">
            {treatment.name}
          </Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
        {justCreated ? null : <Chip label={status.label} tone={status.tone} />}
      </View>
      {description ? <Text style={styles.sub}>{description}</Text> : null}
    </View>
  );
}

/** The summary card while it loads and the list cache does not have the treatment. */
export function TreatmentSummarySkeleton() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={52} height={52} radius={16} />
        <View style={[styles.copy, { gap: 8 }]}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="45%" height={14} />
        </View>
        <Skeleton width={64} height={26} radius={13} />
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.card`
    card: {
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    row: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    h2: { fontSize: 19, lineHeight: 24, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
