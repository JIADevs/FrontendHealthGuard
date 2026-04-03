"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@healthguard/api";
import { useAuthStore } from "@healthguard/stores";
import { isApiError } from "@healthguard/api";
import { Button, TextField } from "@healthguard/ui";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("[LoginPage] Attempting login for:", email);
      const tokens = await login({ email, password });
      console.log("[LoginPage] Login success, tokens received:", { access: !!tokens.access_token });
      setAuth(tokens.access_token, tokens.refresh_token);
      console.log("[LoginPage] Auth set in store, redirecting...");
      router.push("/dashboard");
    } catch (err) {
      console.error("[LoginPage] Login failed:", err);
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError(String(err) || "Error de conexión. Intenta de nuevo.");
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
          Gestión médica inteligente. Inicia sesión para acceder a tus
          documentos, citas y medicamentos.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 20 }}>
            <TextField id="email" label="Correo electrónico" type="email" placeholder="tu@email.com" value={email} onChange={setEmail} required autoComplete="email" />
            <TextField id="password" label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={setPassword} required autoComplete="current-password" />
          </div>

          {error && <p className="form-error">{error}</p>}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            loading={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="login-divider">o continúa con</div>

        <button
          className="btn btn-google"
          type="button"
          disabled
          title="Próximamente"
          id="google-login"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="login-footer">
          ¿No tienes cuenta?{" "}
          <a href="/signup">Crear cuenta</a>
        </div>
      </div>
    </div>
  );
}
