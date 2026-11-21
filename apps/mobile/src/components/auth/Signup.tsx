import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { Info, Mail } from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import { isApiError, login, signup } from "@helu/api";
import { Button, PasswordField, TextField, nativeFont, useAppTheme } from "@helu/ui";
import { registerDevicePushToken } from "../../services/pushTokenRegistration";
import { haptics } from "../../lib/haptics";
import { AuthScreenLayout } from "./AuthScreenLayout";
import { AuthHeader } from "./AuthHeader";
import { AuthFormCard } from "./AuthFormCard";
import { AuthBanner, type AuthBannerProps } from "./AuthBanner";
import { AuthFooterLink } from "./AuthFooterLink";
import { useAuthForm } from "./useAuthForm";

const NETWORK = "No pudimos conectar. Revisa tu conexión e intenta de nuevo.";

export interface SignupProps {
  onLogin: () => void;
  /** Se llama justo antes de entrar a la app, para mostrar la Bienvenida una sola vez. */
  onSignedUp: () => void;
}

/** Registro (m1 · «Registro»): correo y contraseña de mínimo 8 caracteres. */
export function Signup({ onLogin, onSignedUp }: SignupProps) {
  const t = useAppTheme();
  const form = useAuthForm("new");
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
    const credentials = form.getValues();
    try {
      await signup(credentials);
      const tokens = await login(credentials);
      setBanner(null);
      onSignedUp();
      setAuth(tokens.access_token, tokens.refresh_token);
      void registerDevicePushToken();
    } catch (err) {
      haptics.error();
      if (!isApiError(err) || err.isNetworkError || err.isServerError) {
        setBanner({ message: NETWORK, action: { label: "Reintentar", onPress: () => void submit() } });
      } else if (err.status === 400 || err.isConflict) {
        // El backend responde 400 «already exists» cuando el correo ya tiene cuenta.
        form.setFieldError("email", "Ya existe una cuenta con este correo. Inicia sesión.");
      } else if (err.isValidation && err.fieldErrors?.password) {
        form.setFieldError("password", "Usa al menos 8 caracteres.");
      } else if (err.isValidation && err.fieldErrors?.email) {
        form.setFieldError("email", "Revisa el correo: debe tener la forma nombre@ejemplo.com.");
      } else {
        setBanner({ message: "No pudimos crear tu cuenta. Intenta de nuevo." });
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, form, setAuth, onSignedUp]);

  return (
    <AuthScreenLayout>
      <AuthHeader title="Únete a Helu" pose={banner ? "think" : "happy"} />

      <AuthFormCard
        title="Crea tu cuenta"
        subtitle="Gestiona tu información médica de forma segura."
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
        <View style={{ gap: 8 }}>
          <PasswordField
            mode="new"
            label="Contraseña"
            value={form.password}
            onChange={form.setPassword}
            onBlur={form.blurPassword}
            error={form.errors.password}
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            inputRef={form.passwordRef}
          />
          {/* La pista se queda mientras no haya error; el error la reemplaza (formularios.md §2). */}
          {form.errors.password ? null : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Info size={14} color={t.text.secondary} />
              <Text style={{ fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>
                Usa al menos 8 caracteres.
              </Text>
            </View>
          )}
        </View>
        <Button fullWidth loading={submitting} loadingLabel="Creando cuenta…" disabled={submitting} onPress={() => void submit()}>
          Crear cuenta
        </Button>
      </AuthFormCard>

      <AuthFooterLink text="¿Ya tienes cuenta?" linkText="Iniciar sesión ›" onPress={onLogin} />
    </AuthScreenLayout>
  );
}
