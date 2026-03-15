"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signup, login } from "@healthguard/api";
import { useAuthStore } from "@healthguard/stores";
import { isApiError } from "@healthguard/api";

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
          <h1>HealthGuard</h1>
        </div>
        <p className="login-subtitle">
          Crea tu cuenta para gestionar tu información médica de forma segura.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-email">Correo electrónico</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="form-error">{fieldErrors.email}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="signup-password">Contraseña</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p className="form-error">{fieldErrors.password}</p>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="signup-submit"
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="login-footer" style={{ marginTop: 24 }}>
          ¿Ya tienes cuenta?{" "}
          <a href="/login">Iniciar sesión</a>
        </div>
      </div>
    </div>
  );
}
