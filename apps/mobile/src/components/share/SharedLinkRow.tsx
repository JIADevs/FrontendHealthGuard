import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Backpack, Link2 } from "lucide-react-native";
import type { ShareLink } from "@helu/api";
import { Chip, IconTile, PressableScale, fontSize, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { shareLinkMeta } from "./shareUtils";

/**
 * Mockup «Compartidos» (helper `sh`): blue tile when the link is active, grey when it is not, with
 * a link or backpack icon; the title on one line, «2 documentos · vence en 24 h» or «Venció el 28
 * oct», and the «Activo» / «Expirado» chip.
 */
export function SharedLinkRow({ link, onPress }: { link: ShareLink; onPress: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const active = link.status === "active";
  const Icon = link.resourceType === "backpack" ? Backpack : Link2;
  const title = link.resourceType === "backpack" ? `Mochila «${link.title}»` : link.title;
  const meta = shareLinkMeta(link);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${meta}, ${active ? "activo" : "expirado"}`}
      style={styles.card}
    >
      {/* Kit `.t-b` (mission background, brand icon) when active; grey when not. */}
      <IconTile
        tone={active ? "mission" : "neutral"}
        icon={<Icon size={19} strokeWidth={2.2} color={active ? t.brand.solid : t.text.onMuted} />}
      />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Chip label={active ? "Activo" : "Expirado"} tone={active ? "success" : "neutral"} />
    </PressableScale>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
