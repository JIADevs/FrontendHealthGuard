import type { MissionStatus } from "./schemas";

/** Query keys for missions (Misiones PRD §11.1). */
export const missionQK = {
    all: () => ["missions"] as const,
    list: (status: MissionStatus = "active", page = 1) => ["missions", "list", status, page] as const,
    overview: () => ["missions", "overview"] as const,
    detail: (id: string) => ["missions", "detail", id] as const,
    events: (id: string) => ["missions", "events", id] as const,
    suggestions: () => ["missions", "suggestions"] as const,
    suggestionSourceDocuments: (suggestionId: string) => ["missions", "suggestions", suggestionId, "documents"] as const,
    /** Level, streak and badges of the patient in context (DA-4: a manager reads the dependent's). */
    userProgress: (patientId?: string | null) => ["user-progress", patientId ?? null] as const,
    userProgressAll: () => ["user-progress"] as const,
};
