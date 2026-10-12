import { View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme, spacing } from "@helu/ui";
import { ChevronLeft, Share2, MoreVertical, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Menu } from "./Menu";

export interface DetailAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface DetailHeaderProps {
  actions?: DetailAction[];
}

export function DetailHeader({ actions = [] }: DetailHeaderProps) {
  const t = useAppTheme();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  // Renderizar según la cantidad de acciones
  const renderActions = () => {
    if (actions.length === 0) {
      return null;
    }

    // 3 o menos acciones: mostrar todas
    if (actions.length <= 3) {
      return (
        <View style={styles.actionsRow}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <action.icon size={24} color={t.text.primary} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // 4+ acciones: primeros 2 iconos + menú de tres puntos
    return (
      <View style={styles.actionsRow}>
        {actions.slice(0, 2).map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <action.icon size={24} color={t.text.primary} />
          </TouchableOpacity>
        ))}
        <View>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={24} color={t.text.primary} />
          </TouchableOpacity>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            actions={actions.slice(2)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.surface.bgCard, borderBottomColor: t.border.light }]}>
      <View style={styles.content}>
        {/* Botón de volver */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={28} color={t.text.primary} />
        </TouchableOpacity>

        {/* Acciones */}
        {renderActions()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
  },
  backButton: {
    padding: spacing[1],
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  actionButton: {
    padding: spacing[1],
  },
});
