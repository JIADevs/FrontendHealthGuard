import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, ShieldCheck, Settings2, X } from "lucide-react-native";
import type { PermissionResponse } from "expo-modules-core";
import {
  SCANNER_PERMISSION_COPY,
  messageBlockedInSettings,
  messageDismissedDialogHint,
} from "../../utils/scannerPermissionMessages";
import {
  colors,
  palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  Typography,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface ScannerCameraPermissionProps {
  permission: PermissionResponse;
  needsSettings: boolean;
  statusMessage: string | null;
  onRequest: () => void;
  onOpenSettings: () => void;
  onBack: () => void;
}

export function ScannerCameraPermission({
  permission,
  needsSettings,
  statusMessage,
  onRequest,
  onOpenSettings,
  onBack,
}: ScannerCameraPermissionProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const copy = SCANNER_PERMISSION_COPY;

  const showDeniedHint = permission.status === "denied" && !permission.granted;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[palette.brand[50], t.surface.bg]}
        locations={[0, 0.45]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={copy.backA11y}
        >
          <X size={22} color={t.text.secondary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconRingOuter}>
            <View style={styles.iconRingInner}>
              <Camera size={40} color={t.brand.fg} strokeWidth={2} />
            </View>
          </View>

          <View style={styles.title}>
            <Typography variant="h2" align="center">
              {copy.title}
            </Typography>
          </View>

          <View style={styles.subtitleWrap}>
            <Typography variant="body" color="secondary" align="center">
              {copy.subtitle}
            </Typography>
          </View>

          <View style={styles.trustRow}>
            <ShieldCheck size={18} color={t.status.successFg} />
            <Text style={styles.trustText}>{copy.trust}</Text>
          </View>

          {!statusMessage && !showDeniedHint && !needsSettings ? (
            <Text style={styles.hintText}>{copy.hint}</Text>
          ) : null}

          {statusMessage ? (
            <View style={styles.messageBanner} accessibilityRole="alert">
              <Text style={styles.messageText}>{statusMessage}</Text>
            </View>
          ) : null}

          {showDeniedHint || needsSettings ? (
            <View style={styles.blockedCard}>
              <Settings2 size={20} color={t.text.secondary} />
              <Text style={styles.blockedText}>
                {needsSettings ? messageBlockedInSettings() : messageDismissedDialogHint()}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onRequest}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={copy.primaryA11y}
          >
            <Text style={styles.primaryBtnText}>{copy.primaryButton}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, needsSettings && styles.secondaryBtnEmphasis]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel={copy.secondaryA11y}
          >
            <Text style={[styles.secondaryBtnText, needsSettings && styles.secondaryBtnTextEmphasis]}>
              {copy.secondaryButton}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    safe: {
      flex: 1,
      paddingHorizontal: spacing[5],
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: t.surface.bgCard,
      borderWidth: 1,
      borderColor: t.border.light,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing[2],
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: spacing[6],
    },
    iconRingOuter: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: t.brand.tintMed,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing[6],
    },
    iconRingInner: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: t.surface.bgCard,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border.light,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    title: {
      marginBottom: spacing[3],
    },
    subtitleWrap: {
      maxWidth: 320,
      marginBottom: spacing[4],
    },
    trustRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      backgroundColor: t.status.successBg,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderRadius: radii.lg,
      maxWidth: 340,
    },
    trustText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: t.status.successFg,
      fontWeight: fontWeight.medium,
      lineHeight: 20,
    },
    hintText: {
      marginTop: spacing[4],
      maxWidth: 320,
      fontSize: fontSize.sm,
      color: t.text.muted,
      textAlign: "center",
      lineHeight: 20,
    },
    messageBanner: {
      marginTop: spacing[4],
      width: "100%",
      maxWidth: 340,
      backgroundColor: t.status.warningBg,
      borderWidth: 1,
      borderColor: t.status.warningFg,
      borderRadius: radii.md,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    messageText: {
      fontSize: fontSize.sm,
      color: t.status.warningFg,
      lineHeight: 20,
      textAlign: "center",
    },
    blockedCard: {
      marginTop: spacing[4],
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[3],
      width: "100%",
      maxWidth: 340,
      backgroundColor: t.surface.bgCard,
      borderWidth: 1,
      borderColor: t.border.light,
      borderRadius: radii.lg,
      padding: spacing[4],
    },
    blockedText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: t.text.secondary,
      lineHeight: 20,
    },
    footer: {
      paddingBottom: spacing[4],
      gap: spacing[3],
    },
    primaryBtn: {
      width: "100%",
      minHeight: 48,
      borderRadius: radii.sm,
      backgroundColor: t.brand.fg,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
    },
    primaryBtnText: {
      color: colors.white,
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
    },
    secondaryBtn: {
      width: "100%",
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing[2],
    },
    secondaryBtnEmphasis: {
      backgroundColor: t.brand.tintMed,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: t.brand.fg,
    },
    secondaryBtnText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
    },
    secondaryBtnTextEmphasis: {
      color: t.brand.fg,
    },
  });
}
