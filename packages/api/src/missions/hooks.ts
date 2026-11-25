import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@helu/stores";
import {
    acceptMissionSuggestion,
    cancelMission,
    completeMissionStep,
    createMission,
    createMissionStepTask,
    dismissMissionSuggestion,
    getMissionSuggestionSourceDocuments,
    getMissionSuggestions,
    markMissionNoticeSeen,
    restoreMissionSuggestion,
    sendMissionFollowUp,
    getMission,
    getMissionEvents,
    getMissions,
    getMissionsOverview,
    getUserProgress,
    updateMotivationPreferences,
    linkMissionDocument,
    pauseMission,
    resumeMission,
    scheduleMissionSession,
    setMissionSessionAttendance,
    skipMissionStep,
    unlinkMissionDocument,
    updateMission,
} from "./endpoints";
import { missionQK } from "./keys";
import type {
    Mission,
    MissionCreate,
    MissionStepTaskCreate,
    MissionSuggestionAccept,
    MissionType,
    MissionUpdate,
    MissionSessionAttendance,
    MissionSessionCreate,
    MissionStatus,
    MissionStep,
    MissionStepSkip,
    MotivationPreferences,
    UserProgress,
} from "./schemas";

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
    // Steps, sessions and closures award points and badges on the server (Motivación §3).
    qc.invalidateQueries({ queryKey: missionQK.userProgressAll() });
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

type StepVars = { missionId: string; stepKey: string; data?: Record<string, unknown>; reason?: MissionStepSkip["reason"] };

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

/** «Editar nombre y datos» (RF-18): waits for the server. */
export function useUpdateMissionMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: MissionUpdate }) => updateMission(id, payload),
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

// --- therapy sessions (DU-30, RF-39) --------------------------------------------------

/** «Programar sesión»: creates the session's appointment; waits for the server (it changes the count). */
export function useScheduleMissionSessionMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ missionId, payload }: { missionId: string; payload: MissionSessionCreate }) =>
            scheduleMissionSession(missionId, payload, { idempotencyKey: newIdempotencyKey() }),
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
            invalidateMissionQueries(qc, mission.id);
        },
    });
}

/** «Sí, asistí» · «No pude asistir» · «Reprogramar» (attended false + newDate/newTime). */
export function useMissionSessionAttendanceMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            missionId,
            appointmentId,
            payload,
        }: {
            missionId: string;
            appointmentId: string;
            payload: MissionSessionAttendance;
        }) => setMissionSessionAttendance(missionId, appointmentId, payload, { idempotencyKey: newIdempotencyKey() }),
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
            invalidateMissionQueries(qc, mission.id);
        },
    });
}

// --- documents (RF-60, RF-61, DU-18, DU-19) ------------------------------------------------

function useDocumentMutation(fn: (vars: { missionId: string; documentId: string; stepKey?: string }) => Promise<Mission>) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
            invalidateMissionQueries(qc, mission.id);
            // Final documents of an appointment mission are the appointment's post documents (DU-19).
            if (mission.appointment?.id) qc.invalidateQueries({ queryKey: ["appointment", mission.appointment.id] });
        },
    });
}

/** Links an uploaded document; in an appointment mission, `final_documents` goes to the appointment. */
export function useLinkMissionDocumentMutation() {
    return useDocumentMutation(({ missionId, documentId, stepKey }) => linkMissionDocument(missionId, documentId, stepKey));
}

/** Removes the link only: the document stays in Documentos. */
export function useUnlinkMissionDocumentMutation() {
    return useDocumentMutation(({ missionId, documentId }) => unlinkMissionDocument(missionId, documentId));
}

// --- closure follow-up and suggestions (M5) ----------------------------------------------

/** Pending suggestions, newest first (RF-53). The screen groups them by `sourceMission`. */
export function useMissionSuggestionsQuery(enabled = true) {
    return useQuery({ queryKey: missionQK.suggestions(), queryFn: getMissionSuggestions, enabled });
}

/** Final-step documents of the source mission, preselected in «Crear misión» (RF-57). */
export function useSuggestionSourceDocumentsQuery(suggestionId: string | undefined) {
    return useQuery({
        queryKey: missionQK.suggestionSourceDocuments(suggestionId ?? ""),
        queryFn: () => getMissionSuggestionSourceDocuments(suggestionId!),
        enabled: !!suggestionId,
    });
}

/** «¿El médico te pidió algo más?» → suggestions. `needs: []` is «No, nada más» (RF-54). */
export function useMissionFollowUpMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ missionId, needs, idempotencyKey }: { missionId: string; needs: MissionType[]; idempotencyKey?: string }) =>
            sendMissionFollowUp(missionId, { needs }, { idempotencyKey: idempotencyKey ?? newIdempotencyKey() }),
        onSuccess: () => invalidateMissionQueries(qc),
    });
}

/** Creates the mission from a suggestion and links the confirmed documents. Waits for the server. */
export function useAcceptSuggestionMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ suggestionId, payload }: { suggestionId: string; payload: MissionSuggestionAccept }) =>
            acceptMissionSuggestion(suggestionId, payload),
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
            invalidateMissionQueries(qc, mission.id);
        },
    });
}

/** «Ahora no» and its «Deshacer» (DU-42). */
export function useDismissSuggestionMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (suggestionId: string) => dismissMissionSuggestion(suggestionId),
        onSettled: () => invalidateMissionQueries(qc),
    });
}

export function useRestoreSuggestionMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (suggestionId: string) => restoreMissionSuggestion(suggestionId),
        onSettled: () => invalidateMissionQueries(qc),
    });
}

/** Support task of a step (RF-27): a normal Agenda task that the step shows. */
export function useCreateStepTaskMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ missionId, stepKey, payload }: { missionId: string; stepKey: string; payload: MissionStepTaskCreate }) =>
            createMissionStepTask(missionId, stepKey, payload, { idempotencyKey: newIdempotencyKey() }),
        onSuccess: (mission) => {
            qc.setQueryData(missionQK.detail(mission.id), mission);
            invalidateMissionQueries(qc, mission.id);
            qc.invalidateQueries({ queryKey: ["agenda-tasks"] });
        },
    });
}

/** The patient saw «Carlos completó tu misión» (RF-74). Idempotent; a manager never consumes it. */
export function useMarkNoticeSeenMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (missionId: string) => markMissionNoticeSeen(missionId),
        onSettled: () => qc.invalidateQueries({ queryKey: missionQK.overview() }),
    });
}

// --- progress (Motivación PRD) ----------------------------------------------------------

/** Level, streak, badges and the two preferences of the patient in context (RF-90–93). */
export function useUserProgressQuery(enabled = true) {
    const activePatientId = useAuthStore((s) => s.activePatientId);
    return useQuery({
        queryKey: missionQK.userProgress(activePatientId),
        queryFn: getUserProgress,
        staleTime: 60_000,
        enabled,
    });
}

/**
 * «Mostrar racha y nivel» and «Celebraciones»: a toggle changes at once and is saved in the
 * background; on error it goes back and the caller tells the user (MASTER §10, low-risk action).
 */
export function useUpdateMotivationPreferencesMutation() {
    const qc = useQueryClient();
    const activePatientId = useAuthStore((s) => s.activePatientId);
    const key = missionQK.userProgress(activePatientId);
    return useMutation({
        mutationFn: (payload: MotivationPreferences) => updateMotivationPreferences(payload),
        onMutate: async (payload) => {
            await qc.cancelQueries({ queryKey: key });
            const previous = qc.getQueryData<UserProgress>(key);
            if (previous) qc.setQueryData<UserProgress>(key, { ...previous, ...payload });
            return { previous };
        },
        onError: (_err, _payload, ctx) => {
            if (ctx?.previous) qc.setQueryData(key, ctx.previous);
        },
        onSuccess: (progress) => qc.setQueryData(key, progress),
    });
}
