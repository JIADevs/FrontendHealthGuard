import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type {
    AgendaTask,
    AgendaTaskComplete,
    CalendarDay,
    DailyCheckIn,
    DailyCheckInCreate,
    DailyCheckInPage,
    Document,
    Medication,
    MedicationCycle,
    MedicationIntake,
    MedicationIntakeCreate,
    MedicationPage,
} from "./schemas";

export type QuerySnapshot = Array<[QueryKey, unknown]>;

const OPTIMISTIC_USER_ID = "00000000-0000-4000-8000-000000000000";

export function restoreQuerySnapshot(qc: QueryClient, snapshot: QuerySnapshot | undefined): void {
    if (!snapshot) return;
    for (const [key, data] of snapshot) {
        qc.setQueryData(key, data);
    }
}

export async function patchQueryFamilies(
    qc: QueryClient,
    families: ReadonlyArray<readonly string[]>,
    patch: (data: unknown, key: QueryKey) => unknown,
): Promise<QuerySnapshot> {
    for (const queryKey of families) {
        await qc.cancelQueries({ queryKey });
    }
    const snapshot = families.flatMap((queryKey) => qc.getQueriesData({ queryKey }));
    for (const [key, data] of snapshot) {
        if (data === undefined) continue;
        qc.setQueryData(key, patch(data, key));
    }
    return snapshot;
}

export function applyOptimisticIntake(
    data: unknown,
    cycleId: string,
    payload?: MedicationIntakeCreate,
): unknown {
    if (isCalendarDays(data)) {
        let changed = false;
        const days = data.map((day) => {
            const medications = mapMedications(day.medications, cycleId, payload);
            if (medications === day.medications) return day;
            changed = true;
            return { ...day, medications };
        });
        return changed ? days : data;
    }
    if (isMedicationPage(data)) {
        const items = mapMedications(data.items, cycleId, payload);
        return items === data.items ? data : { ...data, items };
    }
    if (isMedication(data)) {
        return patchMedication(data, cycleId, payload);
    }
    return data;
}

/**
 * A document the server just created goes on top of the first page of every unfiltered document
 * list (the API sorts by upload date, newest first). The list shows it right away instead of after
 * the refetch; callers still invalidate `["documents"]`, so the server has the last word.
 */
export function prependCreatedDocument(qc: QueryClient, doc: Document): void {
    for (const [key, data] of qc.getQueriesData({ queryKey: ["documents"] })) {
        if (!isDocumentPage(data) || !isFirstUnfilteredDocumentPage(key)) continue;
        if (data.items.some((item) => item.id === doc.id)) continue;
        const items = [doc, ...data.items].slice(0, data.limit > 0 ? data.limit : data.items.length + 1);
        qc.setQueryData(key, { ...data, items, total: data.total + 1 });
    }
}

/** `QK.documents` is `["documents", page, search, limit, startDate, endDate]`; web also uses `["documents", "all"]`. */
function isFirstUnfilteredDocumentPage(key: QueryKey): boolean {
    if (key[1] === "all") return true;
    const [, page, search, , startDate, endDate] = key;
    return page === 1 && !search && startDate == null && endDate == null;
}

export function buildOptimisticCheckIn(payload: DailyCheckInCreate): DailyCheckIn {
    return {
        id: newOptimisticId(),
        userId: OPTIMISTIC_USER_ID,
        createdBy: null,
        mood: payload.mood,
        recordedAt: payload.recordedAt,
        notes: payload.notes ?? null,
        treatmentId: payload.treatmentId ?? null,
    };
}

export function applyOptimisticCheckIn(
    data: unknown,
    key: QueryKey,
    checkIn: DailyCheckIn,
): unknown {
    if (isCalendarDays(data)) {
        let changed = false;
        const days = data.map((day) => {
            if (!sameDay(day.date, checkIn.recordedAt)) return day;
            if (day.checkIns.some((existing) => sameDay(existing.recordedAt, checkIn.recordedAt))) {
                return day;
            }
            changed = true;
            return { ...day, checkIns: [...day.checkIns, checkIn] };
        });
        return changed ? days : data;
    }
    if (isCheckInPage(data) && shouldPrependCheckIn(key, checkIn.recordedAt)) {
        if (data.items.some((existing) => sameDay(existing.recordedAt, checkIn.recordedAt))) {
            return data;
        }
        return {
            ...data,
            items: [checkIn, ...data.items],
            total: data.total + 1,
        };
    }
    return data;
}

function mapMedications(
    medications: Medication[],
    cycleId: string,
    payload?: MedicationIntakeCreate,
): Medication[] {
    let changed = false;
    const next = medications.map((medication) => {
        const patched = patchMedication(medication, cycleId, payload);
        if (patched !== medication) changed = true;
        return patched;
    });
    return changed ? next : medications;
}

function patchMedication(
    medication: Medication,
    cycleId: string,
    payload?: MedicationIntakeCreate,
): Medication {
    if (!medication.cycles.some((cycle) => cycle.id === cycleId)) return medication;
    return {
        ...medication,
        cycles: medication.cycles.map((cycle) => patchCycle(cycle, cycleId, payload)),
    };
}

function patchCycle(
    cycle: MedicationCycle,
    cycleId: string,
    payload?: MedicationIntakeCreate,
): MedicationCycle {
    if (cycle.id !== cycleId) return cycle;
    const intake = buildOptimisticIntake(cycle, payload);
    const intakes = cycle.intakes.filter((existing) => existing.scheduledTime !== intake.scheduledTime);
    return { ...cycle, intakes: [...intakes, intake] };
}

function buildOptimisticIntake(
    cycle: MedicationCycle,
    payload?: MedicationIntakeCreate,
): MedicationIntake {
    const now = new Date().toISOString();
    const status = payload?.status ?? "TAKEN";
    return {
        id: newOptimisticId(),
        cycleId: cycle.id,
        status,
        scheduledTime: payload?.scheduledTime ?? cycle.nextIntakeTime ?? now,
        takenAt: status === "TAKEN" ? payload?.takenAt ?? now : null,
        notTakenReason: status === "NOT_TAKEN" ? payload?.notTakenReason ?? null : null,
        notes: payload?.notes ?? null,
    };
}

function shouldPrependCheckIn(key: QueryKey, recordedAt: string): boolean {
    const page = key[1];
    if (typeof page === "number" && page !== 1) return false;
    const start = key[2];
    const end = key[3];
    const day = recordedAt.slice(0, 10);
    if (typeof start === "string" && day < start.slice(0, 10)) return false;
    if (typeof end === "string" && day > end.slice(0, 10)) return false;
    return true;
}

function sameDay(left: string, right: string): boolean {
    return left.slice(0, 10) === right.slice(0, 10);
}

// Hermes has no global `crypto`, so this builds a v4-shaped id with Math.random.
// It only tags cache entries until the server answers; it is not a security token.
function newOptimisticId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const nibble = Math.floor(Math.random() * 16);
        return (char === "x" ? nibble : (nibble & 0x3) | 0x8).toString(16);
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isCalendarDays(data: unknown): data is CalendarDay[] {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return true;
    const first: unknown = data[0];
    return isRecord(first) && "date" in first && "medications" in first && "checkIns" in first;
}

function isMedicationPage(data: unknown): data is MedicationPage {
    return isRecord(data) && Array.isArray(data.items) && typeof data.total === "number";
}

/** The medication detail (`["medication", id]`): one medication with its cycles. */
function isMedication(data: unknown): data is Medication {
    return isRecord(data) && typeof data.id === "string" && Array.isArray(data.cycles);
}

function isDocumentPage(data: unknown): data is { items: Document[]; total: number; limit: number } {
    return isRecord(data) && Array.isArray(data.items) && typeof data.total === "number";
}

function isCheckInPage(data: unknown): data is DailyCheckInPage {
    return isRecord(data) && Array.isArray(data.items) && typeof data.total === "number";
}

/**
 * Marks an agenda task as completed in every cache that holds it (detail, task pages, calendar days),
 * so «Completar tarea» changes at once and rolls back if the server fails (movimiento §8, bajo riesgo).
 */
export function applyOptimisticTaskCompletion(data: unknown, taskId: string, result?: AgendaTaskComplete): unknown {
    const complete = (task: AgendaTask): AgendaTask =>
        task.id !== taskId
            ? task
            : {
                  ...task,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                  resultComment: result?.resultComment ?? task.resultComment ?? null,
                  resultDocumentIds: result?.resultDocumentIds ?? task.resultDocumentIds,
                  resultBackpackIds: result?.resultBackpackIds ?? task.resultBackpackIds,
              };
    if (isCalendarDays(data)) {
        let changed = false;
        const days = data.map((day) => {
            if (!day.tasks?.some((t) => t.id === taskId)) return day;
            changed = true;
            return { ...day, tasks: day.tasks.map(complete) };
        });
        return changed ? days : data;
    }
    if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
        const page = data as { items: AgendaTask[] };
        if (!page.items.some((t) => t?.id === taskId)) return data;
        return { ...page, items: page.items.map(complete) };
    }
    if (data && typeof data === "object" && (data as AgendaTask).id === taskId && "startAt" in (data as object)) {
        return complete(data as AgendaTask);
    }
    return data;
}
