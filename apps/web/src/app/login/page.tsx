"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, isApiError } from "@helu/api";
import { useAuthStore } from "@helu/stores";
import { AuthLayout } from "../../components/auth";
import styles from "../../components/auth/auth.module.css";

// ─── Icons (inline SVG to avoid lucide-react dependency in web) ──────────────

function MailIcon() {
  return (
    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tokens = await login({ email, password });
      setAuth(tokens.access_token, tokens.refresh_token);
      router.push("/dashboard");
    } catch (err) {
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
    <AuthLayout
      title="Bienvenido a Helu"
      subtitle="Tu salud, en un solo lugar"
      cardTitle="Inicia sesión en tu cuenta"
      cardSubtitle="Accede para continuar cuidando tu salud."
      error={error}
      footerText="¿No tienes cuenta?"
      footerLink="Regístrate ahora ›"
      footerHref="/signup"
    >
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-email">
            Correo electrónico
          </label>
          <div className={styles.inputContainer}>
            <MailIcon />
            <input
              id="login-email"
              className={styles.textInput}
              type="email"
              placeholder="alejandra@helu.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-password">
            Contraseña
          </label>
          <div className={styles.inputContainer}>
            <LockIcon />
            <input
              id="login-password"
              className={styles.textInput}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className={styles.forgotRow}>
          <a href="#" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!canSubmit}
        >
          {loading ? "Entrando…" : "Entrar"}
          {!loading && <ArrowRightIcon />}
        </button>
      </form>
    </AuthLayout>
  );
}
