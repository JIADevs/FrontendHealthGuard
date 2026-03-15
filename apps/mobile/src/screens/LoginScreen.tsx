import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@healthguard/stores";
import { login, isApiError } from "@healthguard/api";

export function LoginScreen() {
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
      setError(isApiError(err) ? err.message : "Error al iniciar sesión");
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

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="nombre@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading || !email || !password}
            onPress={handleLogin}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 60, height: 60, borderRadius: 16, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#64748b" },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: -8 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: "#f8fafc" },
  button: { backgroundColor: "#0ea5e9", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#dc2626", backgroundColor: "#fef2f2", padding: 12, borderRadius: 8, overflow: "hidden", marginBottom: 16, textAlign: "center" },
});
