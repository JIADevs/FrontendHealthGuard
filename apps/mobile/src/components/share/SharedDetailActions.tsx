import { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Clock, Copy, Eye, ExternalLink } from "lucide-react-native";
import { Button, spacing, radii, fontSize, fontWeight, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface SharedDetailActionsProps {
  onOpenDocument: () => void;
  onViewQr: () => void;
  onCopy: () => void;
  onExtend: () => void;
  openLoading?: boolean;
  copyLoading?: boolean;
  extendLoading?: boolean;
  extendDisabled?: boolean;
  actionsDisabled?: boolean;
}

export function SharedDetailActions({
  onOpenDocument,
  onViewQr,
  onCopy,
  onExtend,
  openLoading = false,
  copyLoading = false,
  extendLoading = false,
  extendDisabled = false,
  actionsDisabled = false,
}: SharedDetailActionsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.wrap}>
      <ActionRow
        icon={<ExternalLink size={18} color={t.brand.fg} />}
        label="Abrir documento"
        onPress={onOpenDocument}
        disabled={actionsDisabled}
        loading={openLoading}
        styles={styles}
      />
      <ActionRow
        icon={<Eye size={18} color={t.brand.fg} />}
        label="Ver QR de nuevo"
        onPress={onViewQr}
        disabled={actionsDisabled}
        styles={styles}
      />
      <ActionRow
        icon={<Copy size={18} color={t.brand.fg} />}
        label="Copiar enlace"
        onPress={onCopy}
        disabled={actionsDisabled}
        loading={copyLoading}
        styles={styles}
      />
      <ActionRow
        icon={<Clock size={18} color={t.brand.fg} />}
        label="Extender 24h más"
        onPress={onExtend}
        disabled={actionsDisabled || extendDisabled}
        loading={extendLoading}
        styles={styles}
      />
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  disabled,
  loading,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Button variant="secondary" fullWidth onPress={onPress} disabled={disabled} loading={loading}>
      <View style={styles.actionRow}>
        {icon}
        <Text style={styles.actionText}>{label}</Text>
      </View>
    </Button>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: {
      gap: spacing[2],
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
    },
    actionText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.primary,
    },
  });
}
