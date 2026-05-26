import { useMemo, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Mail, Link2, MoreHorizontal, MessageCircle } from "lucide-react-native";
import {
  Modal,
  Button,
  Spinner,
  colors,
  spacing,
  radii,
  fontSize,
  fontWeight,
  shadows,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface ShareDocumentModalProps {
  shareUrl: string | null;
  isPreparing: boolean;
  isCopying: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onLink: () => void;
  onMore: () => void;
}

export function ShareDocumentModal({
  shareUrl,
  isPreparing,
  isCopying,
  onClose,
  onCopyLink,
  onWhatsApp,
  onEmail,
  onLink,
  onMore,
}: ShareDocumentModalProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const channelsDisabled = isPreparing || !shareUrl;

  return (
    <Modal title="Compartir documento" onClose={onClose}>
      {isPreparing ? (
        <View style={styles.loading}>
          <Spinner size="lg" />
          <Text style={styles.loadingText}>Generando enlace…</Text>
        </View>
      ) : (
        <>
          <View style={styles.channels}>
            <ShareChannel
              label="WhatsApp"
              iconBg={t.accent.docFg}
              icon={<MessageCircle size={22} color={colors.white} strokeWidth={2.25} />}
              onPress={onWhatsApp}
              disabled={channelsDisabled}
              styles={styles}
            />
            <ShareChannel
              label="Correo"
              iconBg={t.brand.solid}
              icon={<Mail size={22} color={colors.white} strokeWidth={2.25} />}
              onPress={onEmail}
              disabled={channelsDisabled}
              styles={styles}
            />
            <ShareChannel
              label="Enlace"
              iconBg={t.border.light}
              icon={<Link2 size={22} color={t.text.secondary} strokeWidth={2.25} />}
              onPress={onLink}
              disabled={channelsDisabled}
              styles={styles}
            />
            <ShareChannel
              label="Más"
              iconBg={t.border.light}
              icon={<MoreHorizontal size={22} color={t.text.secondary} strokeWidth={2.25} />}
              onPress={onMore}
              disabled={channelsDisabled}
              styles={styles}
            />
          </View>

          <View style={styles.linkCard}>
            <Text style={styles.linkTitle}>Enlace compartido</Text>
            <Text style={styles.linkHint}>Cualquiera con el enlace puede ver</Text>
            <Button
              variant="primary"
              fullWidth
              onPress={onCopyLink}
              disabled={channelsDisabled}
              loading={isCopying}
            >
              Copiar enlace
            </Button>
          </View>
        </>
      )}
    </Modal>
  );
}

function ShareChannel({
  label,
  icon,
  iconBg,
  onPress,
  disabled,
  styles,
}: {
  label: string;
  icon: ReactNode;
  iconBg: string;
  onPress: () => void;
  disabled?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity
      style={styles.channel}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.channelIcon, { backgroundColor: iconBg }, disabled && styles.channelDisabled]}>
        {icon}
      </View>
      <Text style={styles.channelLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    loading: {
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[3],
      paddingVertical: spacing[8],
    },
    loadingText: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
    },
    channels: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing[2],
      marginBottom: spacing[5],
    },
    channel: {
      flex: 1,
      alignItems: "center",
      gap: spacing[2],
    },
    channelIcon: {
      width: 52,
      height: 52,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.sm,
    },
    channelDisabled: {
      opacity: 0.5,
    },
    channelLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: t.text.primary,
      textAlign: "center",
    },
    linkCard: {
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.lg,
      padding: spacing[4],
      gap: spacing[2],
      backgroundColor: t.surface.bg,
    },
    linkTitle: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
    },
    linkHint: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
      marginBottom: spacing[2],
    },
  });
}
