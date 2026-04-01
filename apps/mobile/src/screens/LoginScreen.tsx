import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@healthguard/stores";
import { login, isApiError } from "@healthguard/api";
import { colors, radii, spacing, fontSize, fontWeight, useAppTheme, Button } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function LoginScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const data = await login({ email, password });
      setAuth(data.access_token, data.refresh_token);
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : String(err) || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>H</Text></View>
          <Text style={styles.title}>HealthGuard</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="nombre@ejemplo.com"
            placeholderTextColor={t.text.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={t.text.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            fullWidth
            disabled={!email || !password}
            loading={loading}
            onPress={handleLogin}
          >
            Entrar
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.footerLink}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.surface.bgCard },
    content:        { flex: 1, padding: spacing[6], justifyContent: "center" },
    header:         { alignItems: "center", marginBottom: 40 },
    logo:           { width: 60, height: 60, borderRadius: radii.lg, backgroundColor: colors.sky[500], alignItems: "center", justifyContent: "center", marginBottom: spacing[4] },
    logoText:       { color: colors.white, fontSize: 28, fontWeight: fontWeight.extrabold },
    title:          { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary, marginBottom: spacing[2] },
    subtitle:       { fontSize: fontSize.md, color: t.text.secondary },
    form:           { gap: spacing[4] },
    label:          { fontSize: 14, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: -8 },
    input:          { borderWidth: 1, borderColor: t.border.medium, borderRadius: radii.md, padding: 14, fontSize: fontSize.md, backgroundColor: t.surface.bg, color: t.text.primary },
    error:          { color: colors.error[600], backgroundColor: colors.error[50], padding: spacing[3], borderRadius: radii.sm, overflow: "hidden", marginBottom: spacing[4], textAlign: "center" },
    footer:         { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing[8] },
    footerText:     { color: t.text.secondary, fontSize: fontSize.sm },
    footerLink:     { color: colors.sky[500], fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  });
}
