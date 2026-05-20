import { StyleSheet } from "react-native";
import {
  colors,
  palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  shadows,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export function makeAuthStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // ── Screen ──
    screen: {
      flex: 1,
      backgroundColor: colors.white,
    },
    bgGradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[8],
    },

    // ── Header ──
    header: {
      alignItems: "center",
      marginBottom: spacing[5],
    },
    logo: {
      width: 140,
      height: 140,
      marginBottom: -15,
    },
    brandTitle: {
      fontSize: 26,
      fontWeight: fontWeight.extrabold,
      color: t.text.primary,
      marginBottom: spacing[1],
    },
    brandSubtitle: {
      fontSize: fontSize.base,
      color: t.text.secondary,
    },

    // ── Form Card ──
    formCard: {
      backgroundColor: colors.white,
      borderRadius: 24,
      padding: spacing[6],
      ...shadows.md,
    },
    cardTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
      marginBottom: spacing[1],
    },
    cardSubtitle: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
      marginBottom: spacing[5],
    },
    errorBox: {
      backgroundColor: palette.status.error[50],
      padding: spacing[3],
      borderRadius: radii.sm,
      marginBottom: spacing[4],
    },

    // ── Input fields ──
    fieldGroup: {
      marginBottom: spacing[4],
    },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.primary,
      marginBottom: spacing[2],
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.gray[50],
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.gray[200],
      paddingHorizontal: spacing[3],
      height: 50,
    },
    inputIcon: {
      marginRight: spacing[2],
    },
    textInput: {
      flex: 1,
      fontSize: fontSize.base,
      color: t.text.primary,
      height: "100%",
    },
    eyeButton: {
      padding: spacing[2],
      marginLeft: spacing[1],
    },

    // ── Forgot password ──
    forgotRow: {
      alignItems: "flex-end",
      marginBottom: spacing[5],
    },
    forgotText: {
      fontSize: fontSize.sm,
      color: palette.brand[500],
      fontWeight: fontWeight.semibold,
    },

    // ── Submit button ──
    submitBtn: {
      borderRadius: radii.md,
      overflow: "hidden",
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
      gap: spacing[2],
    },
    submitText: {
      color: colors.white,
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
    },

    // ── Footer ──
    footer: {
      alignItems: "center",
      marginTop: spacing[8],
      gap: spacing[1],
    },
    footerText: {
      fontSize: fontSize.base,
      color: t.text.secondary,
    },
    footerLink: {
      fontSize: fontSize.base,
      color: palette.brand[500],
      fontWeight: fontWeight.bold,
    },
  });
}

export type AuthStyles = ReturnType<typeof makeAuthStyles>;
