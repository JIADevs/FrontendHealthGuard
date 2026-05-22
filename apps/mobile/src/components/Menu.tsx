import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { useAppTheme, spacing, colors, overlay } from "@helu/ui";
import type { DetailAction } from "./DetailHeader";

interface MenuProps {
  visible: boolean;
  onDismiss: () => void;
  actions: DetailAction[];
}

export function Menu({ visible, onDismiss, actions }: MenuProps) {
  const t = useAppTheme();

  const handleAction = (onPress: () => void) => {
    onPress();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.menuContainer}>
          <View style={[styles.menu, { backgroundColor: t.surface.bgCard, borderColor: t.border.light }]}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleAction(action.onPress)}
                style={[
                  styles.menuItem,
                  index < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border.light },
                ]}
              >
                <action.icon
                  size={20}
                  color={action.destructive ? colors.error[600] : t.text.primary}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: action.destructive ? colors.error[600] : t.text.primary },
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: overlay.darker,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    marginTop: 56,
    marginRight: spacing[4],
  },
  menu: {
    minWidth: 200,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
