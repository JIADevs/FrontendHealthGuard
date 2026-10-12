import { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mail, Lock } from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import { login, isApiError } from "@helu/api";
import { registerDevicePushToken } from "../services/pushTokenRegistration";
import { spacing, useAppTheme } from "@helu/ui";
import {
  AuthScreenLayout,
  AuthHeader,
  AuthFormCard,
  AuthTextField,
  AuthSubmitButton,
  AuthFooterLink,
} from "../components/auth";
import { makeAuthStyles } from "../components/auth/authStyles";
import type { RootStackParamList } from "../navigation/RootNavigator";

// ─── Component ───────────────────────────────────────────────────────────────

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeAuthStyles(t), [t]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await login({ email, password });
      setAuth(data.access_token, data.refresh_token);
      void registerDevicePushToken();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : String(err) || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  }, [email, password, setAuth]);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <AuthScreenLayout>
      <AuthHeader title="Bienvenido a Helu" subtitle="Tu salud, en un solo lugar" />

      <AuthFormCard
        title="Inicia sesión en tu cuenta"
        subtitle="Accede para continuar cuidando tu salud."
        error={error}
      >
        <AuthTextField
          label="Correo electrónico"
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder="alejandra@helu.dev"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AuthTextField
          label="Contraseña"
          icon={Lock}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secure
          autoComplete="password"
        />

        {/* Forgot password */}
        <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <AuthSubmitButton
          label="Entrar"
          loadingLabel="Entrando…"
          loading={loading}
          disabled={!canSubmit}
          onPress={handleLogin}
        />
      </AuthFormCard>

      <AuthFooterLink
        text="¿No tienes cuenta?"
        linkText="Regístrate ahora  ›"
        onPress={() => navigation.navigate("Signup")}
      />
    </AuthScreenLayout>
  );
}
