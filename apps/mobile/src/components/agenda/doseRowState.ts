import type { MedicationCycle, MedicationIntake } from "@helu/api";
import { NOT_TAKEN_REASON_LABELS_ES, type AgendaEvent } from "@helu/ui";

export type DoseRowKind = "pending" | "taken" | "not-taken" | "later";

export interface DoseRowState {
  kind: DoseRowKind;
  reasonLabel: string | null;
}

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

const EMPTY: DoseRowState = { kind: "later", reasonLabel: null };

function fromIntake(intake: MedicationIntake | undefined, future: boolean): DoseRowState {
  if (intake?.status === "TAKEN") return { kind: "taken", reasonLabel: null };
  if (intake?.status === "NOT_TAKEN") {
    return {
      kind: "not-taken",
      reasonLabel: intake.notTakenReason ? NOT_TAKEN_REASON_LABELS_ES[intake.notTakenReason] : null,
    };
  }
  if (future) return { kind: "later", reasonLabel: null };
  return { kind: "pending", reasonLabel: null };
}

function intakeNear(cycle: MedicationCycle, slotMs: number): MedicationIntake | undefined {
  return cycle.intakes.find(
    (intake) => Math.abs(new Date(intake.scheduledTime).getTime() - slotMs) < 60_000,
  );
}

export function doseStateForCycle(cycle: MedicationCycle, now = Date.now()): DoseRowState {
  if (!cycle.nextIntakeTime) return EMPTY;
  const slot = new Date(cycle.nextIntakeTime).getTime();
  if (Number.isNaN(slot)) return EMPTY;
  return fromIntake(intakeNear(cycle, slot), slot > now);
}

/** The dose's own time as ISO (the row's day and hour), so «Tomar» records that dose and not «now». */
export function eventSlotIso(event: MedicationEvent): string | undefined {
  const slot = new Date(`${event.dayKey}T${event.intakeTime}`);
  return Number.isNaN(slot.getTime()) ? undefined : slot.toISOString();
}

export function doseStateForEvent(event: MedicationEvent, now = Date.now()): DoseRowState {
  const slot = new Date(`${event.dayKey}T${event.intakeTime}`).getTime();
  const future = Number.isFinite(slot) && slot > now;
  return fromIntake(event.intake, future);
}
