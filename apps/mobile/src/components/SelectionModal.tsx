import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from "react-native";
import { useAppTheme, spacing } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { X, ChevronRight } from "lucide-react-native";
import { useMemo, type ReactNode } from "react";

export interface SelectionOption {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBackground?: string;
  onPress: () => void;
}

export interface SelectionSection {
  title?: string;
  options: SelectionOption[];
}

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  sections: SelectionSection[];
}

export function SelectionModal({ visible, onClose, title, sections }: SelectionModalProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={t.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          <ScrollView style={styles.modalScroll}>
            {sections.map((section, sectionIndex) => (
              <View key={sectionIndex}>
                {section.title && (
                  <View style={styles.modalSectionHeader}>
                    <Text style={styles.modalSectionTitle}>{section.title}</Text>
                  </View>
                )}
                {section.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.modalOption}
                    onPress={option.onPress}
                  >
                    {option.icon && (
                      <View
                        style={[
                          styles.modalOptionIcon,
                          option.iconBackground && { backgroundColor: option.iconBackground },
                        ]}
                      >
                        {option.icon}
                      </View>
                    )}
                    <View style={styles.modalOptionContent}>
                      <Text style={styles.modalOptionTitle}>{option.title}</Text>
                      {option.subtitle && (
                        <Text style={styles.modalOptionSubtitle}>{option.subtitle}</Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={t.text.tertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: t.surface.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
      paddingBottom: spacing[6],
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: t.text.primary,
    },
    modalDivider: {
      height: 1,
      backgroundColor: t.border.light,
      marginBottom: spacing[2],
    },
    modalScroll: {
      paddingHorizontal: spacing[4],
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing[3],
      gap: spacing[3],
    },
    modalOptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalOptionContent: {
      flex: 1,
    },
    modalOptionTitle: {
      fontSize: 15,
      fontWeight: "500",
      color: t.text.primary,
      marginBottom: 2,
    },
    modalOptionSubtitle: {
      fontSize: 13,
      color: t.text.secondary,
    },
    modalSectionHeader: {
      paddingVertical: spacing[2],
      marginTop: spacing[2],
    },
    modalSectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: t.text.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
