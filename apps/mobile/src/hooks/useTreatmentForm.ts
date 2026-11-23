import { useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, type TextInput } from "react-native";
import { isApiError, type Treatment } from "@helu/api";
import { useTreatmentFormCore, type TreatmentStatus } from "@helu/api/hooks";
import { haptics } from "../lib/haptics";
import { notify } from "../lib/notify";
import { useRecentlySaved } from "../lib/recentlySaved";

/** Backend `TreatmentBase.name`: `Field(max_length=255)`. */
const NAME_MAX = 255;

type FieldKey = "name" | "startDate" | "endDate";

/** A 422's `fieldErrors` come keyed by the backend field; each gets our own text, never Pydantic's (§6). */
const SERVER_FIELDS: Record<string, FieldKey> = { name: "name", start_date: "startDate", end_date: "endDate" };
const SERVER_MESSAGES: Record<FieldKey, string> = {
  name: "Revisa el nombre del tratamiento.",
  startDate: "Revisa la fecha de inicio.",
  endDate: "Revisa la fecha de fin.",
};

/** Today on the device as `YYYY-MM-DD` (never `toISOString()`: at night in Colombia it is already tomorrow in UTC). */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nameProblem(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Escribe el nombre del tratamiento.";
  if (trimmed.length > NAME_MAX) return `Usa máximo ${NAME_MAX} caracteres.`;
  return undefined;
}

function datesProblem(startDate: string, endDate: string): string | undefined {
  return startDate && endDate && endDate < startDate ? "La fecha de fin debe ser después del inicio." : undefined;
}

export interface UseTreatmentFormOptions {
  /** The treatment to edit; without it the form creates one (always «Activo», starting today). */
  initial?: Treatment | null;
  /**
   * The server confirmed the save: close the sheet or leave the screen, then show the toast. The
   * hook has already marked the treatment for the list highlight.
   */
  onSaved: (name: string) => void;
  /**
   * Where a failed save is reported. `toast` (default): «No se pudo guardar» + «Reintentar». `banner`:
   * `saveFailure` is set for an inline banner, for forms inside a sheet: the sheet is a `Modal`, and
   * on iOS the app's toast renders under it.
   */
  showErrorAs?: "toast" | "banner";
}

/** A failed save, for the inline banner (formularios.md §6 «Error de red o 5xx»). */
export interface TreatmentSaveFailure {
  message: string;
  /** False when retrying cannot help (the treatment no longer exists). */
  canRetry: boolean;
}

/**
 * Mobile adapter of `useTreatmentFormCore` shared by «Nuevo tratamiento» (sheet) and «Editar
 * tratamiento» (screen). It adds what formularios.md §6–7 asks of the form:
 * - «Nombre» is checked on blur and on submit, and live only after its first error;
 * - «Fin» before «Inicio» shows under «Fin» as soon as it is picked;
 * - on submit with errors: warning haptic, focus on «Nombre» and «Revisa N campos» for screen readers;
 * - a 422 puts our own text under the field the server rejected;
 * - any other failure keeps what was typed and shows «No se pudo guardar» with «Reintentar» (a toast,
 *   or `saveFailure` for a banner).
 */
export function useTreatmentForm({ initial, onSaved, showErrorAs = "toast" }: UseTreatmentFormOptions) {
  const isEdit = !!initial;
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const savedName = useRef("");
  // «Reintentar» runs the latest save, with whatever the person has typed since.
  const retryRef = useRef<() => void>(() => undefined);
  const [nameChecked, setNameChecked] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saveFailure, setSaveFailure] = useState<TreatmentSaveFailure | null>(null);
  const [defaultStartDate] = useState(todayKey);

  const form = useTreatmentFormCore({
    initial,
    defaultStartDate,
    adapters: {
      onSaveSuccess: (savedId) => {
        haptics.success();
        useRecentlySaved.getState().markTreatment(savedId);
      },
      afterSave: () => onSavedRef.current(savedName.current),
      onSaveError: (err) => {
        // The core also keeps its own text in `error`; the toast below replaces it.
        form.clearError();
        if (isApiError(err) && err.isValidation && err.fieldErrors) {
          const mapped: Partial<Record<FieldKey, string>> = {};
          for (const key of Object.keys(err.fieldErrors)) {
            const field = SERVER_FIELDS[key];
            if (field) mapped[field] = SERVER_MESSAGES[field];
          }
          const count = Object.keys(mapped).length;
          if (count > 0) {
            setServerErrors(mapped);
            haptics.warning();
            if (mapped.name) nameRef.current?.focus();
            AccessibilityInfo.announceForAccessibility(count === 1 ? "Revisa 1 campo" : `Revisa ${count} campos`);
            return;
          }
        }
        haptics.error();
        const gone = isApiError(err) && err.isNotFound;
        const rejected = isApiError(err) && err.status >= 400 && err.status < 500;
        const description = gone
          ? "Este tratamiento ya no existe."
          : rejected
            ? "Revisa los datos e intenta de nuevo."
            : "Revisa tu conexión e intenta de nuevo.";
        if (showErrorAs === "banner") {
          setSaveFailure({ message: `No pudimos guardar. ${description}`, canRetry: !gone });
          return;
        }
        notify({
          tone: "error",
          message: "No se pudo guardar",
          description,
          action: gone ? undefined : { label: "Reintentar", onPress: () => retryRef.current() },
        });
      },
    },
  });

  const clearServerError = (field: FieldKey) => {
    if (!serverErrors[field]) return;
    setServerErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const nameError = serverErrors.name ?? (nameChecked ? nameProblem(form.name) : undefined);
  const endDateError = datesProblem(form.startDate, form.endDate) ?? serverErrors.endDate;
  const startDateError = serverErrors.startDate;

  /** Checks every field; on errors it shows them, focuses «Nombre» if it is one, and returns false. */
  const validate = (): boolean => {
    const problems = [nameProblem(form.name), datesProblem(form.startDate, form.endDate)].filter(Boolean).length;
    if (problems === 0) return true;
    setNameChecked(true);
    haptics.warning();
    if (nameProblem(form.name)) nameRef.current?.focus();
    AccessibilityInfo.announceForAccessibility(problems === 1 ? "Revisa 1 campo" : `Revisa ${problems} campos`);
    return false;
  };

  /** Validates and saves. The button shows «Creando…» / «Guardando…» until the server answers. */
  const save = () => {
    if (form.saving || !validate()) return;
    setSaveFailure(null);
    savedName.current = form.name.trim();
    form.handleSave();
  };
  retryRef.current = save;

  // Unsaved changes, against what the form opened with (a new one opens empty, starting today).
  const snapshot = JSON.stringify([form.name.trim(), form.description.trim(), form.status, form.startDate, form.endDate]);
  const [baseline] = useState(snapshot);
  const dirty = snapshot !== baseline;

  return {
    isEdit,
    name: form.name,
    description: form.description,
    status: form.status,
    startDate: form.startDate,
    endDate: form.endDate,
    saving: form.saving,
    saveFailure,
    dirty,
    nameRef,
    nameError,
    startDateError,
    endDateError,
    setName: (value: string) => {
      form.setName(value);
      clearServerError("name");
    },
    onNameBlur: () => {
      if (nameProblem(form.name)) setNameChecked(true);
    },
    setDescription: form.setDescription,
    setStatus: (value: TreatmentStatus) => form.setStatus(value),
    setStartDate: (value: string) => {
      form.setStartDate(value);
      clearServerError("startDate");
    },
    setEndDate: (value: string) => {
      form.setEndDate(value);
      clearServerError("endDate");
    },
    validate,
    save,
  };
}

export type TreatmentForm = ReturnType<typeof useTreatmentForm>;
