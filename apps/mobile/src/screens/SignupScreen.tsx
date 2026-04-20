import { useState } from "react";
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
import { useAuthStore } from "@helu/stores";
import { signup, login, isApiError } from "@helu/api";
import { colors, palette, radii, spacing, fontWeight, Button, TextField, Typography } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function SignupScreen() {
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </View>
            <Typography variant="h2" align="center">Helu</Typography>
            <View style={{ marginTop: spacing[1] }}>
              <Typography variant="bodySm" color="secondary" align="center">
                Crea tu cuenta para gestionar tu información médica de forma segura.
              </Typography>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Typography variant="bodySm" color="error" align="center">{error}</Typography>
            </View>
          ) : null}

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
            <Button fullWidth disabled={!canSubmit} loading={loading} onPress={handleSignup}>
              Crear Cuenta
            </Button>
          </View>

          <View style={styles.footer}>
            <Typography variant="bodySm" color="secondary">¿Ya tienes cuenta? </Typography>
            <TouchableOpacity onPress={() => navigation.navigate("Auth")}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "white" },
  content:    { flexGrow: 1, padding: spacing[6], justifyContent: "center" },
  header:     { alignItems: "center", marginBottom: 40, gap: spacing[1] },
  logo:       { width: 60, height: 60, borderRadius: radii.lg, backgroundColor: palette.brand[500], alignItems: "center", justifyContent: "center", marginBottom: spacing[4] },
  logoText:   { color: colors.white, fontSize: 28, fontWeight: fontWeight.extrabold },
  form:       { gap: spacing[3], marginTop: spacing[2] },
  errorBox:   { backgroundColor: palette.status.error[50], padding: spacing[3], borderRadius: radii.sm, marginBottom: spacing[4] },
  footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing[8] },
  footerLink: { color: palette.brand[500], fontWeight: fontWeight.semibold },
});
