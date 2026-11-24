import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { Mascot, type MascotPose } from "../brand";

/** Kit `empty` (m9): mascot of 100 px, H2, a 14 px line and up to two actions 270 px wide. */
export function EmptyHero({
  pose,
  title,
  description,
  children,
  top = 28,
}: {
  pose: MascotPose;
  title: string;
  description: string;
  children?: ReactNode;
  top?: number;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={[styles.hero, { paddingTop: top }]}>
      <Mascot pose={pose} size={100} />
      <Text style={styles.h2} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.sub}>{description}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
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
    actions: { width: 270, gap: spacing[3], marginTop: 6 },
  });
}
