import { useCallback, useState } from "react";
import { Mail } from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import { isApiError, login } from "@helu/api";
import { Button, PasswordField, TextField, useAppTheme } from "@helu/ui";
import { registerDevicePushToken } from "../../services/pushTokenRegistration";
import { haptics } from "../../lib/haptics";
import { AuthScreenLayout } from "./AuthScreenLayout";
import { AuthHeader } from "./AuthHeader";
import { AuthFormCard } from "./AuthFormCard";
import { AuthBanner, type AuthBannerProps } from "./AuthBanner";
import { AuthFooterLink } from "./AuthFooterLink";
import { useAuthForm } from "./useAuthForm";

const CREDENTIALS = "Correo o contraseña incorrectos. Revisa e intenta de nuevo.";
const NETWORK = "No pudimos conectar. Revisa tu conexión e intenta de nuevo.";

/**
 * Inicio de sesión (m1 · «Inicio de sesión», «Error de inicio de sesión»).
 * «¿Olvidaste tu contraseña?» no aparece hasta que exista el endpoint de recuperación:
 * un enlace que no lleva a ningún lado es un anti-patrón (MASTER).
 */
export function Login({ onSignup }: { onSignup: () => void }) {
  const t = useAppTheme();
  const form = useAuthForm("login");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<AuthBannerProps | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  const submit = useCallback(async () => {
    if (submitting) return;
    // El banner anterior se queda hasta que llegue la respuesta nueva: sacarlo al enviar
    // hacía saltar el formulario dos veces (§6c, nada empuja lo que se está leyendo).
    if (!form.validateAll()) {
      setBanner(null);
      return;
    }
    setSubmitting(true);
    try {
      const data = await login(form.getValues());
      setBanner(null);
      setAuth(data.access_token, data.refresh_token);
      void registerDevicePushToken();
    } catch (err) {
      haptics.error();
      if (!isApiError(err) || err.isNetworkError || err.isServerError) {
        setBanner({ message: NETWORK, action: { label: "Reintentar", onPress: () => void submit() } });
      } else if (err.isForbidden) {
        setBanner({ message: "Tu cuenta necesita una suscripción activa para iniciar sesión." });
      } else if (err.isValidation && err.fieldErrors?.email) {
        form.setFieldError("email", "Revisa el correo: debe tener la forma nombre@ejemplo.com.");
      } else {
        // 400/401: no se dice cuál de los dos falló (formularios.md §6). El correo se conserva.
        setBanner({ message: CREDENTIALS });
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, form, setAuth]);

  return (
    <AuthScreenLayout>
      <AuthHeader title="Bienvenido a Helu" pose={banner ? "think" : "wave"} />

      <AuthFormCard
        title="Inicia sesión en tu cuenta"
        subtitle="Accede para continuar cuidando tu salud."
        banner={banner ? <AuthBanner {...banner} /> : null}
      >
        <TextField
          label="Correo electrónico"
          value={form.email}
          onChange={form.setEmail}
          onBlur={form.blurEmail}
          error={form.errors.email}
          placeholder="Ej: nombre@ejemplo.com"
          leadingIcon={<Mail size={18} color={t.text.secondary} />}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => form.passwordRef.current?.focus()}
          inputRef={form.emailRef}
        />
        <PasswordField
          mode="login"
          label="Contraseña"
          value={form.password}
          onChange={form.setPassword}
          onBlur={form.blurPassword}
          error={form.errors.password}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
          inputRef={form.passwordRef}
        />
        <Button fullWidth loading={submitting} loadingLabel="Iniciando sesión…" disabled={submitting} onPress={() => void submit()}>
          Iniciar sesión
        </Button>
      </AuthFormCard>

      <AuthFooterLink text="¿No tienes cuenta?" linkText="Regístrate ahora ›" onPress={onSignup} />
    </AuthScreenLayout>
  );
}
