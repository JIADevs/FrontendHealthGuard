import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  radii,
  shadows,
  useAppTheme,
  Typography,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileCardProps {
  initials: string;
  name: string;
  email: string;
  onPress: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileCard({ initials, name, email, onPress }: ProfileCardProps) {
  const t = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.surface.bgCard }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: t.brand.fg }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: t.text.primary }]}>{name}</Text>
        <Text style={[styles.email, { color: t.text.secondary }]}>{email}</Text>
      </View>
      <ChevronRight size={20} color={t.text.muted} />
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  email: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
