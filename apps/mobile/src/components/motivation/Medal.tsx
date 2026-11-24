import { View } from "react-native";
import { Lock } from "lucide-react-native";
import { useAppTheme } from "@helu/ui";
import { badgeCopy } from "./badgeCatalog";

/**
 * «Insignia (medalla)» (MASTER §7): a 28/46 px circle with a 3 px bottom edge in the badge color;
 * locked, gray with a padlock. The label always goes next to it (never color alone, § a11y).
 */
export function Medal({ code, earned, size = 46 }: { code: string; earned: boolean; size?: 28 | 46 }) {
  const t = useAppTheme();
  const copy = badgeCopy(code);
  const Icon = copy?.icon;
  const tone = copy ? copy.colors(t) : { bg: t.motivation.level, edge: t.status.warningFg };
  const iconSize = Math.round(size * (earned ? 0.44 : 0.42));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: earned ? tone.bg : t.surface.muted,
        borderBottomWidth: 3,
        borderBottomColor: earned ? tone.edge : t.border.default,
      }}
    >
      {earned && Icon ? (
        <Icon size={iconSize} strokeWidth={2.4} color={t.text.onSolid} />
      ) : (
        <Lock size={iconSize} strokeWidth={2.2} color={t.text.muted} />
      )}
    </View>
  );
}
