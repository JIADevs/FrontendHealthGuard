import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@helu/stores";
import { login, isApiError } from "@helu/api";
import { colors, palette, radii, spacing, fontWeight, useAppTheme, Button, TextField, Typography } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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
          <View style={styles.logo}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Typography variant="h2" align="center">Helu</Typography>
          <View style={{ marginTop: spacing[1] }}>
            <Typography variant="bodySm" color="secondary" align="center">Inicia sesión para continuar</Typography>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Typography variant="bodySm" color="error" align="center">{error}</Typography>
          </View>
        )}

        <View style={styles.form}>
          <TextField
            label="Correo electrónico"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextField
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            type="password"
          />
          <Button fullWidth disabled={!email || !password} loading={loading} onPress={handleLogin}>
            Entrar
          </Button>
        </View>

        <View style={styles.footer}>
          <Typography variant="bodySm" color="secondary">¿No tienes cuenta? </Typography>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Typography variant="bodySm" color="inherit">
              <Text style={styles.footerLink}>Registrarse</Text>
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: t.surface.bg },
    content:    { flex: 1, padding: spacing[6], justifyContent: "center" },
    header:     { alignItems: "center", marginBottom: 40, gap: spacing[1] },
    logo:       { width: 60, height: 60, borderRadius: radii.lg, backgroundColor: palette.brand[500], alignItems: "center", justifyContent: "center", marginBottom: spacing[4] },
    logoText:   { color: colors.white, fontSize: 28, fontWeight: fontWeight.extrabold },
    form:       { gap: spacing[4], marginTop: spacing[4] },
    errorBox:   { backgroundColor: colors.error[50], padding: spacing[3], borderRadius: radii.sm, marginBottom: spacing[4] },
    footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing[8] },
    footerLink: { color: palette.brand[500], fontWeight: fontWeight.semibold },
  });
}
