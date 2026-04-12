"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signup, login } from "@helu/api";
import { useAuthStore } from "@helu/stores";
import { isApiError } from "@helu/api";
import { Button, TextField, Typography } from "@helu/ui";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      await signup({ email, password });
      // Auto-login after signup
      const tokens = await login({ email, password });
      setAuth(tokens.access_token, tokens.refresh_token);
      router.push("/dashboard");
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

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">H</div>
          <Typography variant="h2">Helu</Typography>
        </div>
        <Typography variant="bodySm" color="secondary" align="center">
          Crea tu cuenta para gestionar tu información médica de forma segura.
        </Typography>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 20 }}>
            <TextField id="signup-email" label="Correo electrónico" type="email" placeholder="tu@email.com" value={email} onChange={setEmail} required autoComplete="email" error={fieldErrors.email} />
            <TextField id="signup-password" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={setPassword} required autoComplete="new-password" error={fieldErrors.password} />
          </div>

          {error && <p className="form-error">{error}</p>}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            loading={loading}
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>

        <div className="login-footer" style={{ marginTop: 24 }}>
          ¿Ya tienes cuenta?{" "}
          <a href="/login">Iniciar sesión</a>
        </div>
      </div>
    </div>
  );
}
