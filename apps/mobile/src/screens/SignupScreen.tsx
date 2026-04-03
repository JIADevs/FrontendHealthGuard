import { useState, useMemo } from "react";
import {
  View,
  Text,
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
import { colors, radii, spacing, fontSize, fontWeight, useAppTheme, Button, TextField } from "@healthguard/ui";
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
            <TextField
              label="Correo electrónico"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={fieldErrors.email}
            />

            <TextField
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete="new-password"
              error={fieldErrors.password}
            />

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
    error:        { color: colors.error[600], backgroundColor: colors.error[50], padding: spacing[3], borderRadius: radii.sm, overflow: "hidden", marginBottom: spacing[4], textAlign: "center" },
    footer:       { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing[8] },
    footerText:   { color: t.text.secondary, fontSize: fontSize.sm },
    footerLink:   { color: colors.sky[500], fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  });
}
