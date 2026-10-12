import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { TextField, colors, fontSize, fontWeight, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentPortalFormProps {
  portalUrl: string;
  portalUsername: string;
  portalPassword: string;
  onPortalUrlChange: (value: string) => void;
  onPortalUsernameChange: (value: string) => void;
  onPortalPasswordChange: (value: string) => void;
  disabled?: boolean;
}

export function DocumentPortalForm({
  portalUrl,
  portalUsername,
  portalPassword,
  onPortalUrlChange,
  onPortalUsernameChange,
  onPortalPasswordChange,
  disabled = false,
}: DocumentPortalFormProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.root}>
      <TextField
        label="URL del portal"
        value={portalUrl}
        onChange={onPortalUrlChange}
        placeholder="https://resultados.laboratorio.com"
        required
        disabled={disabled}
        keyboardType="default"
        autoCapitalize="none"
        accessibilityLabel="URL del portal"
      />

      <TextField
        label="Usuario"
        value={portalUsername}
        onChange={onPortalUsernameChange}
        disabled={disabled}
        autoCapitalize="none"
        accessibilityLabel="Usuario del portal"
      />

      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            value={portalPassword}
            onChangeText={onPortalPasswordChange}
            placeholderTextColor={t.text.muted}
            secureTextEntry={!showPassword}
            editable={!disabled}
            autoCapitalize="none"
            accessibilityLabel="Contraseña del portal"
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.gray[400]} />
            ) : (
              <Eye size={18} color={colors.gray[400]} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    root: {
      gap: spacing[4],
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
    },
    field: {
      gap: spacing[2],
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.primary,
    },
    passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border.medium,
      borderRadius: radii.md,
      backgroundColor: t.surface.bgCard,
      paddingRight: spacing[2],
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      fontSize: fontSize.base,
      color: t.text.primary,
    },
    eyeButton: {
      padding: spacing[2],
    },
  });
}
