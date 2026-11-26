import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Backpack, Copy, Ellipsis, Link2 } from "lucide-react-native";
import type { ShareLink } from "@helu/api";
import { Chip, IconTile, PressableScale, SwipeRow, fontSize, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { swipeHaptic } from "../../lib/haptics";
import { shareLinkMeta } from "./shareUtils";

export interface SharedLinkRowProps {
  link: ShareLink;
  onPress: () => void;
  /** Active links only: «Copiar enlace» in the swipe */
  onCopy?: () => void;
  /** Active links only: the «Más» sheet (swipe or long press) */
  onMore?: () => void;
  /** First-time discovery of the swipe (§4b «Descubrir») */
  peek?: boolean;
}

/**
 * Mockup «Compartidos» (helper `sh`): blue tile when the link is active, grey when it is not, with
 * a link or backpack icon; the title on one line, «2 documentos · vence en 24 h» or «Venció el 28
 * oct», and the «Activo» / «Expirado» chip. An active link swipes to «Más» + «Copiar enlace»
 * (module 14, v2.35); an expired or revoked one only opens its detail, so it does not swipe.
 */
export function SharedLinkRow({ link, onPress, onCopy, onMore, peek }: SharedLinkRowProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const active = link.status === "active";
  const Icon = link.resourceType === "backpack" ? Backpack : Link2;
  const title = link.resourceType === "backpack" ? `Mochila «${link.title}»` : link.title;
  const meta = shareLinkMeta(link);

  const label = `${title}, ${meta}, ${active ? "activo" : "expirado"}`;
  const WHITE = { size: 22, strokeWidth: 2.2, color: t.text.onSolid };
  const swipes = active && onCopy && onMore;

  const row = (
    <PressableScale
      onPress={onPress}
      accessible={!swipes}
      accessibilityRole="button"
      accessibilityLabel={label}
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

  if (!swipes) return row;
  return (
    <SwipeRow
      id={`${link.resourceType}-${link.linkId}`}
      accessibilityLabel={label}
      onPress={onPress}
      endActions={[
        { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: onMore },
        { key: "copy", tone: "primary", label: "Copiar enlace", icon: <Copy {...WHITE} />, onPress: onCopy },
      ]}
      onLongPress={onMore}
      onHaptic={swipeHaptic}
      peek={peek}
    >
      {row}
    </SwipeRow>
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
