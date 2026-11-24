import { z } from "zod";
import { apiClient } from "../client";
import { ShareResultSchema, type ShareCreateOptions } from "../shares/schemas";
import {
    MissionCreateSchema,
    MissionDocumentSchema,
    MissionEventPageSchema,
    MissionOverviewSchema,
    MissionPageSchema,
    MissionSchema,
    MissionSuggestionSchema,
    UserProgressSchema,
    type MissionCreate,
    type MissionFollowUp,
    type MissionSessionAttendance,
    type MissionSessionCreate,
    type MissionStatus,
    type MissionStepComplete,
    type MissionStepSkip,
    type MissionStepTaskCreate,
    type MissionSuggestionAccept,
    type MissionUpdate,
    type MotivationPreferences,
} from "./schemas";

/** Missions routes (Misiones PRD §10.5). Mutations accept an optional `Idempotency-Key`. */

type Idem = { idempotencyKey?: string };
const idem = (o?: Idem) => (o?.idempotencyKey ? { headers: { "Idempotency-Key": o.idempotencyKey } } : undefined);

// --- read ----------------------------------------------------------------------------

/** `active` comes ordered by `nextAction.dueAt` (no date last, paused last); `completed` by `completedAt` desc. */
export async function getMissions(params: { status?: MissionStatus; page?: number; limit?: number } = {}) {
    const { data } = await apiClient.get("/missions", { params });
    return MissionPageSchema.parse(data);
}

export async function getMissionsOverview() {
    const { data } = await apiClient.get("/missions/overview");
    return MissionOverviewSchema.parse(data);
}

export async function getMission(id: string) {
    const { data } = await apiClient.get(`/missions/${id}`);
    return MissionSchema.parse(data);
}

export async function getMissionEvents(id: string, params: { page?: number; limit?: number } = {}) {
    const { data } = await apiClient.get(`/missions/${id}/events`, { params });
    return MissionEventPageSchema.parse(data);
}

// --- mission lifecycle ---------------------------------------------------------------

export async function createMission(payload: MissionCreate, o?: Idem) {
    const { data } = await apiClient.post("/missions", MissionCreateSchema.parse(payload), idem(o));
    return MissionSchema.parse(data);
}

export async function updateMission(id: string, payload: MissionUpdate) {
    const { data } = await apiClient.patch(`/missions/${id}`, payload);
    return MissionSchema.parse(data);
}

export async function pauseMission(id: string, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/pause`, null, idem(o));
    return MissionSchema.parse(data);
}

export async function resumeMission(id: string, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/resume`, null, idem(o));
    return MissionSchema.parse(data);
}

export async function cancelMission(id: string, reason: "not_attended" | "user_canceled" = "user_canceled", o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/cancel`, { reason }, idem(o));
    return MissionSchema.parse(data);
}

/** Waits for the server: closure, celebration and rewards are never optimistic (DU-6). */
export async function completeMission(id: string, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/complete`, null, idem(o));
    return MissionSchema.parse(data);
}

// --- steps ---------------------------------------------------------------------------

export async function completeMissionStep(id: string, stepKey: string, payload: MissionStepComplete = {}, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/steps/${stepKey}/complete`, payload, idem(o));
    return MissionSchema.parse(data);
}

export async function skipMissionStep(id: string, stepKey: string, payload: MissionStepSkip = {}, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/steps/${stepKey}/skip`, payload, idem(o));
    return MissionSchema.parse(data);
}

export async function editMissionStep(id: string, stepKey: string, stepData: Record<string, unknown>) {
    const { data } = await apiClient.patch(`/missions/${id}/steps/${stepKey}`, { data: stepData });
    return MissionSchema.parse(data);
}

export async function createMissionStepTask(id: string, stepKey: string, payload: MissionStepTaskCreate, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/steps/${stepKey}/tasks`, payload, idem(o));
    return MissionSchema.parse(data);
}

// --- documents and sharing -----------------------------------------------------------

export async function linkMissionDocument(id: string, documentId: string, stepKey?: string) {
    const { data } = await apiClient.post(`/missions/${id}/documents`, { documentId, stepKey });
    return MissionSchema.parse(data);
}

export async function unlinkMissionDocument(id: string, documentId: string) {
    const { data } = await apiClient.delete(`/missions/${id}/documents/${documentId}`);
    return MissionSchema.parse(data);
}

/** Creates or reuses the mission backpack, syncs it and returns the usual share result (RF-63–64). */
export async function shareMission(id: string, options: ShareCreateOptions = { expiresIn: "24h" }) {
    const { data } = await apiClient.post(`/missions/${id}/share`, { expiresIn: options.expiresIn });
    return ShareResultSchema.parse(data);
}

// --- therapy sessions ----------------------------------------------------------------

export async function scheduleMissionSession(id: string, payload: MissionSessionCreate, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/sessions`, payload, idem(o));
    return MissionSchema.parse(data);
}

export async function setMissionSessionAttendance(id: string, appointmentId: string, payload: MissionSessionAttendance, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/sessions/${appointmentId}/attendance`, payload, idem(o));
    return MissionSchema.parse(data);
}

// --- closure, follow-up and suggestions ----------------------------------------------

export async function sendMissionFollowUp(id: string, payload: MissionFollowUp, o?: Idem) {
    const { data } = await apiClient.post(`/missions/${id}/follow-up`, payload, idem(o));
    return z.array(MissionSuggestionSchema).parse(data);
}

export async function getMissionSuggestions() {
    const { data } = await apiClient.get("/missions/suggestions");
    return z.array(MissionSuggestionSchema).parse(data);
}

export async function getMissionSuggestionSourceDocuments(suggestionId: string) {
    const { data } = await apiClient.get(`/missions/suggestions/${suggestionId}/source-documents`);
    return z.array(MissionDocumentSchema).parse(data);
}

export async function acceptMissionSuggestion(suggestionId: string, payload: MissionSuggestionAccept = {}, o?: Idem) {
    const { data } = await apiClient.post(`/missions/suggestions/${suggestionId}/accept`, payload, idem(o));
    return MissionSchema.parse(data);
}

export async function dismissMissionSuggestion(suggestionId: string) {
    const { data } = await apiClient.post(`/missions/suggestions/${suggestionId}/dismiss`);
    return MissionSuggestionSchema.parse(data);
}

/** «Deshacer» after «Ahora no»: the suggestion is pending again (DU-42). */
export async function restoreMissionSuggestion(suggestionId: string) {
    const { data } = await apiClient.post(`/missions/suggestions/${suggestionId}/restore`);
    return MissionSuggestionSchema.parse(data);
}

/** Marks the «Carlos completó tu misión» toast as seen (RF-74). Idempotent. */
export async function markMissionNoticeSeen(id: string) {
    await apiClient.post(`/missions/${id}/notice-seen`);
}

// --- progress (Motivación) -----------------------------------------------------------

export async function getUserProgress() {
    const { data } = await apiClient.get("/users/me/progress");
    return UserProgressSchema.parse(data);
}

export async function updateMotivationPreferences(payload: MotivationPreferences) {
    const { data } = await apiClient.patch("/users/me/progress/preferences", payload);
    return UserProgressSchema.parse(data);
}
