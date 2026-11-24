import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { TreatmentDailyCheckInRef } from "@helu/api";
import { fontSize, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { MoodFace } from "../agenda/MoodFace";
import { MOOD_CONFIG } from "../agenda/moodConfig";
import { moodTrend } from "./treatmentFormat";

/**
 * «Check-ins» in the detail (mockup m3): the last faces, oldest to newest, and what changed this week
 * («De «Mal» a «Bien»: mejorando esta semana»). Worked out on the device from the check-ins the
 * detail already brings.
 */
export function TreatmentCheckIns({ checkIns }: { checkIns: TreatmentDailyCheckInRef[] }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { faces, sentence } = useMemo(() => moodTrend(checkIns), [checkIns]);
  const moods = faces.map((c) => MOOD_CONFIG[c.mood].label).join(", ");
  return (
    <View style={styles.row} accessible accessibilityLabel={`Últimos check-ins: ${moods}.${sentence ? ` ${sentence}.` : ""}`}>
      <View style={styles.faces}>
        {faces.map((c) => (
          <MoodFace key={c.id} mood={c.mood} size={30} />
        ))}
      </View>
      {sentence ? <Text style={styles.sentence}>{sentence}</Text> : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    faces: { flexDirection: "row", gap: spacing[2] },
    sentence: { flex: 1, minWidth: 0, fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
