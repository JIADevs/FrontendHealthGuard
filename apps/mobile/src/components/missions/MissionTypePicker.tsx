import { StyleSheet, Text, View } from "react-native";
import { Info } from "lucide-react-native";
import type { MissionType } from "@helu/api";
import { IconTile, PressableScale, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { missionTypeHint, missionTypeLabel, missionTypeTone } from "./missionCopy";

export const MISSION_TYPES: MissionType[] = ["medical_appointment", "medication", "medical_exam", "therapy"];

/**
 * The four mission types as radio cards (mockups «Nueva misión» and 4c «D2», «D4»). `selected` may be
 * null: nothing is marked until the person picks (DU-52). `error` shows under the list, and the
 * continue button stays enabled (MASTER: no disabled buttons).
 */
export function MissionTypePicker({
  selected,
  onSelect,
  labels,
  hints,
  error,
}: {
  selected: MissionType | null;
  onSelect: (type: MissionType) => void;
  /** Per-type label override, e.g. «Empezar una terapia» in the document sheet (DU-48). */
  labels?: Partial<Record<MissionType, string>>;
  /** Per-type hint override, e.g. «Lo elegimos por el tipo de orden». */
  hints?: Partial<Record<MissionType, string>>;
  error?: string;
}) {
  const t = useAppTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <View accessibilityRole="radiogroup" style={{ gap: spacing[2] }}>
        {MISSION_TYPES.map((ty) => {
          const on = ty === selected;
          const label = labels?.[ty] ?? missionTypeLabel[ty];
          return (
            <PressableScale
              key={ty}
              onPress={() => onSelect(ty)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
              style={[
                styles.option,
                { borderColor: on ? t.brand.solid : t.border.default, backgroundColor: on ? t.brand.tint : t.surface.bgCard },
              ]}
            >
              <IconTile tone={missionTypeTone[ty]} icon={<MissionTypeIcon type={ty} size={19} color={t.text.secondary} />} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: t.text.primary }]}>{label}</Text>
                <Text style={[styles.hint, { color: t.text.secondary }]}>{hints?.[ty] ?? missionTypeHint[ty]}</Text>
              </View>
              <View style={[styles.radio, { borderColor: on ? t.brand.solid : t.border.default }]}>
                {on ? <View style={[styles.radioDot, { backgroundColor: t.brand.solid }]} /> : null}
              </View>
            </PressableScale>
          );
        })}
      </View>
      {error ? (
        <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Info size={14} strokeWidth={2.4} color={t.status.errorFg} />
          <Text style={[styles.errorText, { color: t.status.errorFg }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 12, borderRadius: 16, borderWidth: 1.5, minHeight: 44 },
  title: { fontSize: 15, fontFamily: nativeFont("body", 600) },
  hint: { fontSize: 13, fontFamily: nativeFont("body", 400) },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  error: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: nativeFont("body", 600) },
});
