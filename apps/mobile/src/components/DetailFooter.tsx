import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { spacing, useAppTheme, colors, palette } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { ReactNode } from "react";

export interface FooterAction {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: "primary" | "outline" | "destructive";
  disabled?: boolean;
}

interface DetailFooterProps {
  actions: FooterAction[];
}

export function DetailFooter({ actions }: DetailFooterProps) {
  const t = useAppTheme();
  const styles = makeStyles(t);

  if (actions.length === 0) return null;

  return (
    <View style={[styles.footer, { backgroundColor: t.surface.bgCard, borderTopColor: t.border.light }]}>
      <View style={styles.actionsRow}>
        {actions.map((action, index) => {
          if (action.variant === "destructive") {
            return (
              <TouchableOpacity
                key={index}
                style={styles.destructiveButton}
                onPress={action.onPress}
                disabled={action.disabled}
                activeOpacity={0.7}
              >
                <Text style={[styles.destructiveText, { color: t.status.errorFg }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          }
          if (action.variant === "primary") {
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.primaryButton,
                  { backgroundColor: palette.brand[500] },
                  action.disabled && styles.disabledButton,
                ]}
                onPress={action.onPress}
                disabled={action.disabled}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryText}>{action.label}</Text>
              </TouchableOpacity>
            );
          }
          // outline: icon on top, label below
          return (
            <TouchableOpacity
              key={index}
              style={[styles.outlineButton, { borderColor: t.border.medium }]}
              onPress={action.onPress}
              disabled={action.disabled}
              activeOpacity={0.7}
            >
              {action.icon}
              <Text style={[styles.outlineText, { color: t.text.primary }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    footer: {
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
      paddingBottom: spacing[6],
      borderTopWidth: 1,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: spacing[2],
    },
    outlineButton: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[1],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[2],
      borderRadius: 14,
      borderWidth: 1.5,
      minHeight: 64,
    },
    outlineText: {
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    destructiveButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing[3],
      minHeight: 64,
    },
    destructiveText: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    primaryButton: {
      flex: 1.5,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[3],
      borderRadius: 18,
      minHeight: 64,
    },
    disabledButton: {
      opacity: 0.6,
    },
    primaryText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
  });
