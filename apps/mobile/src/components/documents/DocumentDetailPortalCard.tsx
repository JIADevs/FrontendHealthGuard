import { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { Eye, EyeOff, Copy, ExternalLink } from "lucide-react-native";
import {
  Button,
  Typography,
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentDetailPortalCardProps {
  portalUrl: string;
  portalUsername?: string | null;
  portalPassword?: string | null;
}

export function DocumentDetailPortalCard({
  portalUrl,
  portalUsername,
  portalPassword,
}: DocumentDetailPortalCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [opening, setOpening] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copyingField, setCopyingField] = useState<string | null>(null);

  const handleOpenPortal = useCallback(async () => {
    if (!portalUrl) return;
    setOpening(true);
    try {
      const canOpen = await Linking.canOpenURL(portalUrl);
      if (!canOpen) {
        Toast.show({ type: "error", text1: "No se pudo abrir el portal" });
        return;
      }
      await Linking.openURL(portalUrl);
    } catch {
      Toast.show({ type: "error", text1: "No se pudo abrir el portal" });
    } finally {
      setOpening(false);
    }
  }, [portalUrl]);

  const handleCopy = useCallback(async (field: string, value: string) => {
    setCopyingField(field);
    try {
      await Clipboard.setStringAsync(value);
      Toast.show({ type: "success", text1: "Copiado" });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo copiar" });
    } finally {
      setCopyingField(null);
    }
  }, []);

  const maskedPassword = portalPassword ? "•".repeat(Math.min(portalPassword.length, 12)) : null;

  return (
    <View style={styles.card}>
      <Button
        variant="primary"
        fullWidth
        onPress={() => void handleOpenPortal()}
        loading={opening}
        disabled={!portalUrl}
      >
        <View style={styles.openRow}>
          <ExternalLink size={18} color={colors.white} />
          <Text style={styles.openText}>Abrir portal</Text>
        </View>
      </Button>

      {portalUsername ? (
        <CredentialRow
          label="Usuario"
          value={portalUsername}
          styles={styles}
          onCopy={() => void handleCopy("username", portalUsername)}
          copying={copyingField === "username"}
        />
      ) : null}

      {portalPassword ? (
        <View style={styles.credentialRow}>
          <View style={styles.credentialMain}>
            <Text style={styles.credentialLabel}>Contraseña</Text>
            <Text style={styles.credentialValue} selectable={showPassword}>
              {showPassword ? portalPassword : maskedPassword}
            </Text>
          </View>
          <View style={styles.credentialActions}>
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOff size={18} color={t.text.secondary} />
              ) : (
                <Eye size={18} color={t.text.secondary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleCopy("password", portalPassword)}
              style={styles.iconBtn}
              disabled={copyingField === "password"}
              accessibilityRole="button"
              accessibilityLabel="Copiar contraseña"
            >
              <Copy size={18} color={t.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CredentialRow({
  label,
  value,
  styles,
  onCopy,
  copying,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof makeStyles>;
  onCopy: () => void;
  copying: boolean;
}) {
  const t = useAppTheme();

  return (
    <View style={styles.credentialRow}>
      <View style={styles.credentialMain}>
        <Text style={styles.credentialLabel}>{label}</Text>
        <Text style={styles.credentialValue} selectable>{value}</Text>
      </View>
      <TouchableOpacity
        onPress={onCopy}
        style={styles.iconBtn}
        disabled={copying}
        accessibilityRole="button"
        accessibilityLabel={`Copiar ${label.toLowerCase()}`}
      >
        <Copy size={18} color={t.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.lg,
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      gap: spacing[4],
    },
    openRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
    },
    openText: {
      color: colors.white,
      fontWeight: fontWeight.bold,
      fontSize: fontSize.sm,
    },
    credentialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[2],
      borderTopWidth: 1,
      borderTopColor: t.border.light,
    },
    credentialMain: {
      flex: 1,
      gap: spacing[1],
    },
    credentialLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      textTransform: "uppercase",
    },
    credentialValue: {
      fontSize: fontSize.sm,
      color: t.text.primary,
      fontWeight: fontWeight.medium,
    },
    credentialActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    iconBtn: {
      padding: spacing[2],
    },
  });
}
