import { useEffect, useMemo } from "react";
import Toast from "react-native-toast-message";
import { useMedicationByIdQuery } from "@helu/api/hooks";
import {
  resolveCycleForDay,
  findIntakeForSlot,
  localDateKeyFromISO,
  extractIntakeTimeHHMM,
  type AgendaEvent,
} from "@helu/ui";

export interface UseMedicationIntakeIntentParams {
  /** Gate: only fetches/derives while true (caller resets after consuming the result). */
  enabled: boolean;
  medicationId?: string;
  cycleId?: string;
  scheduledTime?: string;
  /** Not used for resolution (the fetched medication carries its own name); kept for parity with the push/route payload. */
  medicationName?: string;
}

export type MedicationIntakeIntentStatus =
  | "idle"
  | "loading"
  | "ready"
  | "missing-fields"
  | "error";

type MedicationAgendaEvent = Extract<AgendaEvent, { type: "medication" }>;

export interface MedicationIntakeIntentResult {
  status: MedicationIntakeIntentStatus;
  /** Ready-to-render event for `<MedicationIntakeModal />`. Only set when `status === "ready"`. */
  event: MedicationAgendaEvent | null;
}

/**
 * Resolves a MEDICATION notification intent into an `AgendaEvent` without
 * depending on the calendar query — the medication is fetched directly by id
 * and `dayKey`/`intakeTime` are derived from `scheduledTime` in device-local
 * time (Decision 4, `openspec/changes/push-notification-fixes/design.md`).
 */
export function useMedicationIntakeIntent(
  params: UseMedicationIntakeIntentParams,
): MedicationIntakeIntentResult {
  const { enabled, medicationId, cycleId, scheduledTime } = params;
  const hasRequiredFields = !!medicationId && !!cycleId && !!scheduledTime;
  const queryEnabled = enabled && hasRequiredFields;

  const query = useMedicationByIdQuery(queryEnabled ? medicationId! : "");

  useEffect(() => {
    if (enabled && !hasRequiredFields) {
      Toast.show({
        type: "error",
        text1: "No se pudo abrir el recordatorio",
        text2: "Faltan datos de la notificación.",
      });
    }
  }, [enabled, hasRequiredFields]);

  useEffect(() => {
    if (queryEnabled && query.isError) {
      Toast.show({
        type: "error",
        text1: "No se pudo abrir el recordatorio",
        text2: "Intenta desde la lista de medicamentos.",
      });
    }
  }, [queryEnabled, query.isError]);

  const event = useMemo<MedicationAgendaEvent | null>(() => {
    if (!queryEnabled || !query.data || !scheduledTime || !cycleId) return null;

    const dayKey = localDateKeyFromISO(scheduledTime);
    const intakeTime = extractIntakeTimeHHMM(scheduledTime);
    const cycle = resolveCycleForDay(query.data, dayKey);
    if (!cycle) return null;

    return {
      type: "medication",
      data: query.data,
      cycleId,
      dayKey,
      intakeTime,
      intake: findIntakeForSlot(cycle, dayKey, intakeTime),
      sortKey: 0,
    };
  }, [queryEnabled, query.data, scheduledTime, cycleId]);

  if (!enabled) return { status: "idle", event: null };
  if (!hasRequiredFields) return { status: "missing-fields", event: null };
  if (query.isLoading) return { status: "loading", event: null };
  if (query.isError || !event) return { status: "error", event: null };
  return { status: "ready", event };
}
