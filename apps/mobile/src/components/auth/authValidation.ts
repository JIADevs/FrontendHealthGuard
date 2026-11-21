/** Mensajes de formularios.md §6 (causa + cómo arreglar). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Escribe tu correo.";
  if (!EMAIL_RE.test(v)) return "Revisa el correo: debe tener la forma nombre@ejemplo.com.";
  return undefined;
}

/** `login` solo pide que no esté vacía: la regla de 8 caracteres es para crearla. */
export function validatePassword(value: string, mode: "login" | "new"): string | undefined {
  if (!value) return "Escribe tu contraseña.";
  if (mode === "new" && value.length < 8) return "Usa al menos 8 caracteres.";
  return undefined;
}
