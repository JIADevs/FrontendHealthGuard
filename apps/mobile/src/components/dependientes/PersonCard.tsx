import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, nativeFont, spacing, useAppTheme } from "@helu/ui";

/** «JP» from «Juan Pérez», «JU» from «juan@…». */
export function initialsOf(nameOrEmail: string): string {
  const words = nameOrEmail.split("@")[0]!.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return (words[0] ?? "?").slice(0, 2).toUpperCase();
}

/** A person's round avatar: their initials on the color chosen for them. */
export function PersonAvatar({ label, color, size = 44 }: { label: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initialsOf(label)}</Text>
    </View>
  );
}

/**
 * Mockup helper `person` (module 8): tight card with the avatar, name, a line about the link and an
 * action on the right; `footer` holds actions under the row (Aceptar / Rechazar).
 */
export function PersonCard({
  name,
  detail,
  color,
  right,
  footer,
}: {
  name: string;
  detail: string;
  color: string;
  right?: ReactNode;
  footer?: ReactNode;
}) {
  const t = useAppTheme();
  return (
    <View style={[styles.card, { borderColor: t.border.default, backgroundColor: t.surface.bgCard }]}>
      <View style={styles.row}>
        <PersonAvatar label={name} color={color} />
        <View style={styles.copy}>
          <Text style={[styles.name, { color: t.text.primary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.detail, { color: t.text.secondary }]} numberOfLines={2}>
            {detail}
          </Text>
        </View>
        {right}
      </View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3], padding: 14, borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("heading", 800) },
  detail: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  avatar: { alignItems: "center", justifyContent: "center" },
  initials: { color: colors.white, fontFamily: nativeFont("heading", 900) },
});
