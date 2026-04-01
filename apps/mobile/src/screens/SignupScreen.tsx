import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@healthguard/stores";
import { signup, login, isApiError } from "@healthguard/api";
import { colors, radii, spacing, fontSize, fontWeight, useAppTheme, Button } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function SignupScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSignup() {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await signup({ email, password });
      // Auto-login after signup
      const tokens = await login({ email, password });
      setAuth(tokens.access_token, tokens.refresh_token);
    } catch (err) {
      if (isApiError(err)) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        } else {
          setError(err.message);
        }
      } else {
        setError("Error de conexión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length >= 8 && !loading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </View>
            <Text style={styles.title}>HealthGuard</Text>
            <Text style={styles.subtitle}>
              Crea tu cuenta para gestionar tu información médica de forma segura.
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.form}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={[styles.input, fieldErrors.email ? styles.inputError : null]}
              placeholder="nombre@ejemplo.com"
              placeholderTextColor={t.text.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : null}

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, fieldErrors.password ? styles.inputError : null]}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={t.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}

            <Button
              fullWidth
              disabled={!canSubmit}
              loading={loading}
              onPress={handleSignup}
            >
              Crear Cuenta
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Auth")}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: t.surface.bgCard },
    content:      { flexGrow: 1, padding: spacing[6], justifyContent: "center" },
    header:       { alignItems: "center", marginBottom: 40 },
    logo:         { width: 60, height: 60, borderRadius: radii.lg, backgroundColor: colors.sky[500], alignItems: "center", justifyContent: "center", marginBottom: spacing[4] },
    logoText:     { color: colors.white, fontSize: 28, fontWeight: fontWeight.extrabold },
    title:        { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary, marginBottom: spacing[2] },
    subtitle:     { fontSize: fontSize.sm, color: t.text.secondary, textAlign: "center", lineHeight: 20 },
    form:         { gap: spacing[3] },
    label:        { fontSize: 14, fontWeight: fontWeight.semibold, color: t.text.primary },
    input:        { borderWidth: 1, borderColor: t.border.medium, borderRadius: radii.md, padding: 14, fontSize: fontSize.md, backgroundColor: t.surface.bg, color: t.text.primary },
    inputError:   { borderColor: colors.error[400] },
    fieldError:   { color: colors.error[500], fontSize: fontSize.xs, marginTop: -spacing[1] },
    error:        { color: colors.error[600], backgroundColor: colors.error[50], padding: spacing[3], borderRadius: radii.sm, overflow: "hidden", marginBottom: spacing[4], textAlign: "center" },
    footer:       { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing[8] },
    footerText:   { color: t.text.secondary, fontSize: fontSize.sm },
    footerLink:   { color: colors.sky[500], fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  });
}
