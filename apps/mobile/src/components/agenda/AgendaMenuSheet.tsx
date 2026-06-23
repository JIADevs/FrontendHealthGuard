import { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { CalendarDays, List, Pill, Heart, Check } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export type AgendaView = "calendar" | "appointments" | "medications" | "wellbeing";

interface AgendaMenuSheetProps {
  visible: boolean;
  activeView: AgendaView;
  onClose: () => void;
  onSelect: (view: AgendaView) => void;
}

const MENU_ITEMS: {
  view: AgendaView;
  label: string;
  Icon: typeof CalendarDays;
}[] = [
  { view: "calendar", label: "Calendario", Icon: CalendarDays },
  { view: "appointments", label: "Citas", Icon: List },
  { view: "medications", label: "Medicamentos", Icon: Pill },
  { view: "wellbeing", label: "Bienestar", Icon: Heart },
];

export function AgendaMenuSheet({
  visible,
  activeView,
  onClose,
  onSelect,
}: AgendaMenuSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {MENU_ITEMS.map(({ view, label, Icon }) => {
            const isActive = activeView === view;
            const iconColor = isActive ? t.brand.fg : t.text.secondary;

            return (
              <TouchableOpacity
                key={view}
                style={[styles.row, isActive && styles.rowActive]}
                onPress={() => {
                  onSelect(view);
                  onClose();
                }}
                accessibilityLabel={label}
              >
                <Icon size={20} color={iconColor} />
                <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
                  {label}
                </Text>
                {isActive ? <Check size={18} color={iconColor} /> : null}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.surface.bgCard,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      paddingBottom: spacing[8],
      paddingHorizontal: spacing[4],
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radii.full,
      backgroundColor: t.border.medium,
      marginVertical: spacing[3],
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[3],
      borderRadius: radii.md,
    },
    rowActive: {
      backgroundColor: t.surface.bg,
    },
    rowLabel: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: t.text.primary,
    },
    rowLabelActive: {
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
    },
  });
}
