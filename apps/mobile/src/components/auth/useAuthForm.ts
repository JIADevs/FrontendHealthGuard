import { useCallback, useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, TextInput } from "react-native";

type InputHandle = ComponentRef<typeof TextInput>;
import { haptics } from "../../lib/haptics";
import { validateEmail, validatePassword } from "./authValidation";

type Field = "email" | "password";
type Errors = Partial<Record<Field, string>>;

/**
 * Estado de los campos de Acceso con la validación de formularios.md §6:
 * al salir del campo, en vivo solo después del primer error, y todo al enviar con el foco
 * en el primer campo con error.
 */
export function useAuthForm(mode: "login" | "new") {
  const [email, setEmailValue] = useState("");
  const [password, setPasswordValue] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  // Último valor escrito: la validación al salir del campo no debe leer un render viejo
  // (escribir rápido y tocar el siguiente campo dejaba un error de un valor a medias).
  const values = useRef({ email: "", password: "" });
  const emailRef = useRef<InputHandle>(null);
  const passwordRef = useRef<InputHandle>(null);

  const check = useCallback(
    (field: Field, value: string) => (field === "email" ? validateEmail(value) : validatePassword(value, mode)),
    [mode],
  );

  const setEmail = useCallback(
    (v: string) => {
      values.current.email = v;
      setEmailValue(v);
      setErrors((e) => (e.email ? { ...e, email: check("email", v) } : e));
    },
    [check],
  );
  const setPassword = useCallback(
    (v: string) => {
      values.current.password = v;
      setPasswordValue(v);
      setErrors((e) => (e.password ? { ...e, password: check("password", v) } : e));
    },
    [check],
  );

  const blur = useCallback(
    (field: Field) => () => {
      const value = values.current[field];
      setErrors((e) => {
        // Salir de un campo vacío sin haber escrito no es un error todavía.
        if (!value && !e[field]) return e;
        return { ...e, [field]: check(field, value) };
      });
    },
    [check],
  );

  /** Valida todo. Si algo falla: error bajo cada campo, foco al primero y aviso al lector. */
  const validateAll = useCallback((): boolean => {
    const { email, password } = values.current;
    const next: Errors = { email: check("email", email), password: check("password", password) };
    setErrors(next);
    const invalid = (["email", "password"] as const).filter((f) => next[f]);
    if (invalid.length === 0) return true;
    haptics.warning();
    (invalid[0] === "email" ? emailRef : passwordRef).current?.focus();
    AccessibilityInfo.announceForAccessibility(
      invalid.length === 1 ? "Revisa 1 campo" : `Revisa ${invalid.length} campos`,
    );
    return false;
  }, [check]);

  const setFieldError = useCallback((field: Field, message: string) => {
    setErrors((e) => ({ ...e, [field]: message }));
    (field === "email" ? emailRef : passwordRef).current?.focus();
  }, []);

  /** Valores al momento de enviar (la tecla «retorno» puede llegar antes del último render). */
  const getValues = useCallback(() => ({ email: values.current.email.trim(), password: values.current.password }), []);

  return {
    email,
    password,
    getValues,
    errors,
    setEmail,
    setPassword,
    blurEmail: blur("email"),
    blurPassword: blur("password"),
    emailRef,
    passwordRef,
    validateAll,
    setFieldError,
  };
}
