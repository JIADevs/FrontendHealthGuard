import { useMemo } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import { Copy, Share2, Clock } from "lucide-react-native";
import { Button, Typography, colors, spacing, radii, fontSize, fontWeight, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { qrCodeImageUriForShareUrl, resolveExpoReachableUrl } from "../../utils/shareLinks";
import { formatShareExpiresInHuman } from "./shareUtils";

export interface ShareQrPanelProps {
  title: string;
  subtitle?: string;
  shareUrl: string;
  expiresAt: string | null;
  onCopy: () => void;
  onSend: () => void;
  copyLoading?: boolean;
  sendDisabled?: boolean;
}

export function ShareQrPanel({
  title,
  subtitle,
  shareUrl,
  expiresAt,
  onCopy,
  onSend,
  copyLoading = false,
  sendDisabled = false,
}: ShareQrPanelProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const resolvedUrl = resolveExpoReachableUrl(shareUrl);
  const qrUri = qrCodeImageUriForShareUrl(shareUrl);

  return (
    <View style={styles.wrap}>
      <ShareResourceSummaryInline title={title} subtitle={subtitle} />
      <View style={styles.qrCard}>
        <Image source={{ uri: qrUri }} style={styles.qr} accessibilityLabel="Código QR del enlace" />
        <Typography variant="caption" color="secondary" numberOfLines={2}>
          {resolvedUrl}
        </Typography>
        <View style={styles.expRow}>
          <Clock size={14} color={t.text.secondary} />
          <Typography variant="caption" color="secondary">
            {formatShareExpiresInHuman(expiresAt)}
          </Typography>
        </View>
      </View>
      <Button fullWidth onPress={onCopy} loading={copyLoading} disabled={!shareUrl}>
        <View style={styles.btnRow}>
          <Copy size={16} color={colors.white} />
          <Text style={styles.btnPrimaryText}>Copiar enlace</Text>
        </View>
      </Button>
      <Button variant="secondary" fullWidth onPress={onSend} disabled={sendDisabled || !shareUrl}>
        <View style={styles.btnRow}>
          <Share2 size={16} color={t.brand.fg} />
          <Text style={styles.btnSecondaryText}>Enviar</Text>
        </View>
      </Button>
    </View>
  );
}

function ShareResourceSummaryInline({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useAppTheme();
  return (
    <View style={{ gap: spacing[1], marginBottom: spacing[3] }}>
      <Typography variant="label">{title}</Typography>
      {subtitle ? (
        <Typography variant="caption" color="secondary">
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: {
      gap: spacing[3],
    },
    qrCard: {
      alignItems: "center",
      padding: spacing[5],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
      gap: spacing[3],
    },
    qr: {
      width: 200,
      height: 200,
      borderRadius: radii.md,
    },
    expRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    btnRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    btnPrimaryText: {
      color: colors.white,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    btnSecondaryText: {
      color: t.text.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
  });
}
