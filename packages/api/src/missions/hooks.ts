import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
    cancelMission,
    completeMissionStep,
    createMission,
    getMission,
    getMissionEvents,
    getMissions,
    getMissionsOverview,
    pauseMission,
    resumeMission,
    skipMissionStep,
} from "./endpoints";
import { missionQK } from "./keys";
import type { Mission, MissionCreate, MissionStatus, MissionStep } from "./schemas";

/** One key per user action, reused on retries of that action (RNF-13). */
function newIdempotencyKey() {
    return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** After any mission change: lists, overview (Inicio) and agenda data that the hook may touch. */
export function invalidateMissionQueries(qc: QueryClient, missionId?: string) {
    qc.invalidateQueries({ queryKey: missionQK.all() });
    if (missionId) qc.invalidateQueries({ queryKey: missionQK.detail(missionId) });
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["calendar"] });
}

// --- queries ---------------------------------------------------------------------------

/** `active` includes paused missions, ordered by the date of their next step (list H2). */
export function useMissionsQuery(status: Extract<MissionStatus, "active" | "completed"> = "active", page = 1) {
    return useQuery({
        queryKey: missionQK.list(status, page),
        queryFn: () => getMissions({ status, page, limit: 50 }),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useMissionsOverviewQuery(enabled = true) {
    return useQuery({
        queryKey: missionQK.overview(),
        queryFn: getMissionsOverview,
        staleTime: 30_000,
        enabled,
    });
}

export function useMissionQuery(id: string | undefined) {
    return useQuery({
        queryKey: missionQK.detail(id ?? ""),
        queryFn: () => getMission(id as string),
        enabled: Boolean(id),
        staleTime: 15_000,
    });
}

export function useMissionEventsQuery(id: string | undefined) {
    return useQuery({
        queryKey: missionQK.events(id ?? ""),
        queryFn: () => getMissionEvents(id as string),
        enabled: Boolean(id),
    });
}

// --- optimistic step mutations (DU-6, RNF-10) ------------------------------------------

type StepVars = { missionId: string; stepKey: string; data?: Record<string, unknown>; reason?: "not_applicable" | "no_authorization_needed" | "nothing_to_save" };

/**
 * Patches the cached mission as if the server had accepted the step, so the timeline moves at
 * once. Only plain steps are patched: the final step closes the mission and derived steps
 * depend on the appointment, so those wait for the server.
 */
export function applyOptimisticStep(mission: Mission, stepKey: string, status: MissionStep["status"]): Mission {
    const steps = mission.steps.map((s) => (s.key === stepKey ? { ...s, status, completedAt: new Date().toISOString() } : s));
    const applicable = steps.filter((s) => s.applies);
    const nextIndex = applicable.findIndex((s) => s.status !== "completed" && s.status !== "skipped");
    const next = nextIndex >= 0 ? applicable[nextIndex] : undefined;
    const done = applicable.filter((s) => s.status === "completed" || s.status === "skipped").length;
    return {
        ...mission,
        steps,
        nextAction: next
            // The app labels steps from its own copy by key; the server label arrives on settle.
            ? { stepKey: next.key, label: mission.nextAction?.label ?? next.key, dueAt: mission.nextAction?.dueAt ?? null, position: nextIndex + 1, total: applicable.length }
            : null,
        progress: mission.progress.unit === "steps" ? { ...mission.progress, completed: done } : mission.progress,
    };
}

/** Steps that can move optimistically (not derived, not final). */
export function isOptimisticStep(mission: Mission | undefined, stepKey: string) {
    const step = mission?.steps.find((s) => s.key === stepKey);
    if (!step || step.derived) return false;
    const lastApplicable = [...(mission?.steps ?? [])].filter((s) => s.applies).pop();
    return lastApplicable?.key !== stepKey && step.kind !== "sessions" && step.kind !== "receipt";
}

function useStepMutation(kind: "complete" | "skip") {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ missionId, stepKey, data, reason }: StepVars & { idempotencyKey?: string }) => {
            const o = { idempotencyKey: newIdempotencyKey() };
            return kind === "complete"
                ? completeMissionStep(missionId, stepKey, { data: data ?? {} }, o)
                : skipMissionStep(missionId, stepKey, { reason: reason ?? "not_applicable" }, o);
        },
        onMutate: async ({ missionId, stepKey }) => {
            const key = missionQK.detail(missionId);
            const previous = qc.getQueryData<Mission>(key);
            if (!previous || !isOptimisticStep(previous, stepKey)) return { previous: undefined, key };
            await qc.cancelQueries({ queryKey: key });
            qc.setQueryData<Mission>(key, applyOptimisticStep(previous, stepKey, kind === "complete" ? "completed" : "skipped"));
            return { previous, key };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous);
        },
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
        },
        onSettled: (_data, _err, vars) => invalidateMissionQueries(qc, vars.missionId),
    });
}

export function useCompleteMissionStepMutation() {
    return useStepMutation("complete");
}

export function useSkipMissionStepMutation() {
    return useStepMutation("skip");
}

// --- mutations that wait for the server ------------------------------------------------

export function useCreateMissionMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: MissionCreate) => createMission(payload, { idempotencyKey: newIdempotencyKey() }),
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
            invalidateMissionQueries(qc);
        },
    });
}

function useTransition(fn: (id: string) => Promise<Mission>) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
            invalidateMissionQueries(qc, mission.id);
        },
    });
}

export function usePauseMissionMutation() {
    return useTransition((id) => pauseMission(id, { idempotencyKey: newIdempotencyKey() }));
}

export function useResumeMissionMutation() {
    return useTransition((id) => resumeMission(id, { idempotencyKey: newIdempotencyKey() }));
}

export function useCancelMissionMutation() {
    return useTransition((id) => cancelMission(id, "user_canceled", { idempotencyKey: newIdempotencyKey() }));
}
