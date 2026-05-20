import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import {
  palette,
  spacing,
  fontSize,
  fontWeight,
  radii,
  shadows,
  useAppTheme,
} from "@helu/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}

// ─── MenuItem ────────────────────────────────────────────────────────────────

export function MenuItem({ icon, label, badge, onPress, danger, last }: MenuItemProps) {
  const t = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.item,
        { borderBottomColor: t.border.light },
        last && styles.itemLast,
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text
        style={[
          styles.label,
          { color: danger ? palette.status.error[500] : t.text.primary },
        ]}
      >
        {label}
      </Text>
      {badge !== undefined && badge !== null && (
        <Text style={[styles.badge, { color: t.text.secondary }]}>{badge}</Text>
      )}
      {!danger && <ChevronRight size={18} color={t.text.muted} />}
    </TouchableOpacity>
  );
}

// ─── MenuSection ─────────────────────────────────────────────────────────────

interface MenuSectionProps {
  children: React.ReactNode;
}

export function MenuSection({ children }: MenuSectionProps) {
  const t = useAppTheme();

  return (
    <View style={[styles.section, { backgroundColor: t.surface.bgCard }]}>
      {children}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    ...shadows.sm,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  label: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginRight: spacing[2],
  },
});
