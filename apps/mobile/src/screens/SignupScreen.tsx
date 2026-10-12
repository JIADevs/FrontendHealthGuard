import { useState, useCallback } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mail, Lock } from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import { signup, login, isApiError } from "@helu/api";
import { registerDevicePushToken } from "../services/pushTokenRegistration";
import { spacing } from "@helu/ui";
import {
  AuthScreenLayout,
  AuthHeader,
  AuthFormCard,
  AuthTextField,
  AuthSubmitButton,
  AuthFooterLink,
} from "../components/auth";
import type { RootStackParamList } from "../navigation/RootNavigator";

// ─── Component ───────────────────────────────────────────────────────────────

export function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSignup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signup({ email, password });
      const tokens = await login({ email, password });
      setAuth(tokens.access_token, tokens.refresh_token);
      void registerDevicePushToken();
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError("Error de conexión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, setAuth]);

  const canSubmit = email.trim().length > 0 && password.length >= 8 && !loading;

  return (
    <AuthScreenLayout>
      <AuthHeader title="Únete a Helu" subtitle="Tu salud, en un solo lugar" />

      <AuthFormCard
        title="Crea tu cuenta"
        subtitle="Gestiona tu información médica de forma segura."
        error={error}
      >
        <AuthTextField
          label="Correo electrónico"
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder="nombre@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AuthTextField
          label="Contraseña"
          icon={Lock}
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres"
          secure
          autoComplete="new-password"
        />

        <View style={{ marginTop: spacing[2] }}>
          <AuthSubmitButton
            label="Crear Cuenta"
            loadingLabel="Creando…"
            loading={loading}
            disabled={!canSubmit}
            onPress={handleSignup}
          />
        </View>
      </AuthFormCard>

      <AuthFooterLink
        text="¿Ya tienes cuenta?"
        linkText="Iniciar sesión  ›"
        onPress={() => navigation.navigate("Auth")}
      />
    </AuthScreenLayout>
  );
}
