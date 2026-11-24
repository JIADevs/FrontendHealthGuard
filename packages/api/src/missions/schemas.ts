import { z } from "zod";
import { createPageSchema } from "../schemas";

/**
 * Missions contract (Misiones PRD §10.5). Mirrors BackendHealthGuard `app/schemas/mission.py`
 * and `gamification.py`. The API answers snake_case; `apiClient` camelizes it before parsing.
 */

// --- enums ---------------------------------------------------------------------------

export const MissionTypeSchema = z.enum(["medical_appointment", "medical_exam", "medication", "therapy"]);
export const MissionStatusSchema = z.enum(["active", "paused", "completed", "canceled"]);
export const MissionOriginSchema = z.enum(["manual", "appointment_created", "follow_up", "onboarding"]);
export const MissionStepStatusSchema = z.enum(["pending", "in_progress", "completed", "skipped"]);
export const MissionStepKindSchema = z.enum(["confirm", "schedule", "documents", "receipt", "sessions"]);
export const MissionSkipReasonSchema = z.enum(["not_applicable", "no_authorization_needed", "nothing_to_save"]);
export const MissionCancelReasonSchema = z.enum(["not_attended", "user_canceled"]);
export const MissionProgressUnitSchema = z.enum(["steps", "sessions"]);
export const MissionSessionsPhaseSchema = z.enum(["schedule", "upcoming", "confirm_attendance", "finish"]);
export const MissionSuggestionStatusSchema = z.enum(["pending", "accepted", "dismissed"]);
export const MissionTaskStatusSchema = z.enum(["pending", "completed"]);
export const MissionActionSchema = z.enum([
    "complete_step", "skip_step", "edit_step", "pause", "resume", "cancel",
    "complete", "share", "follow_up",
]);
export const MissionEventTypeSchema = z.enum([
    "created", "step_completed", "step_skipped", "step_edited", "document_linked",
    "document_unlinked", "shared", "paused", "resumed", "canceled", "completed",
    "appointment_changed", "session_attended", "task_created", "suggestion_accepted",
]);
const AppointmentStatusSchema = z.enum([
    "PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI", "PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED",
]);

// --- output pieces -------------------------------------------------------------------

export const MissionActorSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullish(),
});

export const MissionRefSchema = z.object({
    id: z.string().uuid(),
    type: MissionTypeSchema,
    title: z.string(),
});

export const MissionStepSchema = z.object({
    key: z.string(),
    kind: MissionStepKindSchema,
    position: z.number().int(),
    status: MissionStepStatusSchema,
    applies: z.boolean().default(true),
    required: z.boolean().default(true),
    /** State read from the linked appointment (DA-12). */
    derived: z.boolean().default(false),
    skipReason: MissionSkipReasonSchema.nullish(),
    data: z.record(z.unknown()).default({}),
    completedAt: z.string().nullish(),
    completedBy: MissionActorSchema.nullish(),
});

export const MissionNextActionSchema = z.object({
    stepKey: z.string(),
    label: z.string(),
    dueAt: z.string().nullish(),
    position: z.number().int(),
    total: z.number().int(),
});

export const MissionProgressSchema = z.object({
    unit: MissionProgressUnitSchema,
    completed: z.number().int(),
    /** null while a therapy total is pending (RF-40). */
    total: z.number().int().nullish(),
});

export const MissionAppointmentSchema = z.object({
    id: z.string().uuid(),
    date: z.string(),
    time: z.string(),
    status: AppointmentStatusSchema,
    location: z.string().nullish(),
    clinic: z.string().nullish(),
});

export const MissionDocumentSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    stepKey: z.string().nullish(),
    addedAt: z.string().nullish(),
    /** Post-appointment document (DU-19). */
    fromAppointment: z.boolean().default(false),
});

export const MissionTaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    startAt: z.string(),
    status: MissionTaskStatusSchema,
    stepKey: z.string().nullish(),
});

export const MissionSessionsSchema = z.object({
    attended: z.number().int(),
    total: z.number().int().nullish(),
    next: z
        .object({
            number: z.number().int(),
            appointmentId: z.string().uuid(),
            date: z.string(),
            time: z.string().nullish(),
        })
        .nullish(),
    phase: MissionSessionsPhaseSchema,
    /** Message of the phase with its ordinal (RF-43, DU-31): «Programa tu quinta sesión». Backend M3. */
    label: z.string().nullish(),
    /** «Tus sesiones», newest first (mockup v2.29 · A). */
    items: z
        .array(
            z.object({
                appointmentId: z.string().uuid(),
                date: z.string(),
                time: z.string().nullish(),
                status: z.enum(["PROGRAMADA", "ASISTI", "NO_ASISTI", "CANCELADA"]),
                number: z.number().int().nullish(),
                counts: z.boolean(),
                label: z.string(),
            }),
        )
        .default([]),
});

// --- mission -------------------------------------------------------------------------

/** Row of the missions list (list H2). */
export const MissionSummarySchema = z.object({
    id: z.string().uuid(),
    type: MissionTypeSchema,
    status: MissionStatusSchema,
    title: z.string(),
    nextAction: MissionNextActionSchema.nullish(),
    progress: MissionProgressSchema,
    updatedAt: z.string(),
    completedAt: z.string().nullish(),
});

export const MissionSchema = MissionSummarySchema.extend({
    userId: z.string().uuid(),
    origin: MissionOriginSchema,
    templateVersion: z.number().int(),
    details: z.record(z.unknown()).default({}),
    steps: z.array(MissionStepSchema).default([]),
    appointment: MissionAppointmentSchema.nullish(),
    documents: z.array(MissionDocumentSchema).default([]),
    tasks: z.array(MissionTaskSchema).default([]),
    sessions: MissionSessionsSchema.nullish(),
    parentMission: MissionRefSchema.nullish(),
    medicationId: z.string().uuid().nullish(),
    backpackId: z.string().uuid().nullish(),
    availableActions: z.array(MissionActionSchema).default([]),
    createdBy: MissionActorSchema.nullish(),
    completedBy: MissionActorSchema.nullish(),
    cancelReason: MissionCancelReasonSchema.nullish(),
    createdAt: z.string(),
    canceledAt: z.string().nullish(),
});

export const MissionPageSchema = createPageSchema(MissionSummarySchema);

// --- overview (list H2 and Inicio, DU-37) --------------------------------------------

export const MissionNextStepSchema = z.object({
    missionId: z.string().uuid(),
    missionTitle: z.string(),
    type: MissionTypeSchema,
    stepKey: z.string(),
    label: z.string(),
    hint: z.string().nullish(),
    /** null → chip «Sin fecha». */
    dueAt: z.string().nullish(),
    position: z.number().int(),
    total: z.number().int(),
});

export const MissionNoticeSchema = z.object({
    missionId: z.string().uuid(),
    missionTitle: z.string(),
    completedBy: MissionActorSchema,
    achievement: z.object({ code: z.string(), name: z.string() }).nullish(),
});

export const MissionOverviewSchema = z.object({
    nextStep: MissionNextStepSchema.nullish(),
    counts: z
        .object({
            active: z.number().int().default(0),
            completed: z.number().int().default(0),
            suggestions: z.number().int().default(0),
        })
        .default({}),
    suggestionsSummary: z.string().nullish(),
    notices: z.array(MissionNoticeSchema).default([]),
});

// --- suggestions and events ----------------------------------------------------------

export const MissionSuggestionSchema = z.object({
    id: z.string().uuid(),
    type: MissionTypeSchema,
    status: MissionSuggestionStatusSchema,
    sourceMission: MissionRefSchema,
    acceptedMissionId: z.string().uuid().nullish(),
    createdAt: z.string(),
    resolvedAt: z.string().nullish(),
});

export const MissionEventSchema = z.object({
    id: z.string().uuid(),
    type: MissionEventTypeSchema,
    stepKey: z.string().nullish(),
    actor: MissionActorSchema.nullish(),
    createdAt: z.string(),
});

export const MissionEventPageSchema = createPageSchema(MissionEventSchema);

// --- inputs (camelCase here; apiClient snakelizes the body) ---------------------------

export const MissionCreateSchema = z.object({
    type: MissionTypeSchema,
    title: z.string().max(200).optional(),
    /** Per type: examName, therapyType, medicationName, specialty/reason (mission_details.py). */
    details: z.record(z.unknown()).default({}),
    appointmentId: z.string().uuid().optional(),
    medicationId: z.string().uuid().optional(),
    sessionsTotal: z.number().int().min(1).max(200).optional(),
});

export const MissionUpdateSchema = z.object({
    title: z.string().max(200).optional(),
    details: z.record(z.unknown()).optional(),
    sessionsTotal: z.number().int().min(1).max(200).nullish(),
});

export const MissionStepCompleteSchema = z.object({
    data: z.record(z.unknown()).default({}),
});

export const MissionStepSkipSchema = z.object({
    reason: MissionSkipReasonSchema.default("not_applicable"),
});

export const MissionFollowUpSchema = z.object({
    /** Empty = «No, nada más» (RF-54). */
    needs: z.array(MissionTypeSchema).max(4).default([]),
});

export const MissionSuggestionAcceptSchema = z.object({
    title: z.string().max(200).optional(),
    details: z.record(z.unknown()).default({}),
    documentIds: z.array(z.string().uuid()).max(50).default([]),
});

export const MissionSessionCreateSchema = z.object({
    date: z.string(),
    time: z.string(),
    location: z.string().max(300).optional(),
    clinic: z.string().max(255).optional(),
    modality: z.enum(["PRESENCIAL", "VIRTUAL", "DOMICILIARIA"]).default("PRESENCIAL"),
});

export const MissionSessionAttendanceSchema = z.object({
    attended: z.boolean(),
    newDate: z.string().optional(),
    newTime: z.string().optional(),
});

export const MissionStepTaskCreateSchema = z.object({
    title: z.string().min(1).max(200),
    startAt: z.string(),
    reminderOffsets: z.array(z.number().int()).max(5).default([]),
});

// --- progress (Motivación PRD) -------------------------------------------------------

export const UserLevelSchema = z.object({
    number: z.number().int().min(1),
    /** Configurable in the backend `levels` table: show it as is, never hardcode names. */
    name: z.string(),
    minPoints: z.number().int(),
    nextMinPoints: z.number().int().nullish(),
});

export const UserBadgeSchema = z.object({
    code: z.string(),
    name: z.string(),
    earned: z.boolean().default(false),
    awardedAt: z.string().nullish(),
});

export const UserProgressSchema = z.object({
    pointsTotal: z.number().int().default(0),
    level: UserLevelSchema,
    streak: z.object({ current: z.number().int().default(0), longest: z.number().int().default(0) }).default({}),
    badges: z.array(UserBadgeSchema).default([]),
    showProgress: z.boolean().default(true),
    celebrationsEnabled: z.boolean().default(true),
});

export const MotivationPreferencesSchema = z.object({
    showProgress: z.boolean().optional(),
    celebrationsEnabled: z.boolean().optional(),
});

// --- types ---------------------------------------------------------------------------

export type MissionType = z.infer<typeof MissionTypeSchema>;
export type MissionStatus = z.infer<typeof MissionStatusSchema>;
export type MissionStep = z.infer<typeof MissionStepSchema>;
export type MissionNextAction = z.infer<typeof MissionNextActionSchema>;
export type MissionProgress = z.infer<typeof MissionProgressSchema>;
export type MissionSessions = z.infer<typeof MissionSessionsSchema>;
export type MissionSummary = z.infer<typeof MissionSummarySchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type MissionPage = z.infer<typeof MissionPageSchema>;
export type MissionNextStep = z.infer<typeof MissionNextStepSchema>;
export type MissionNotice = z.infer<typeof MissionNoticeSchema>;
export type MissionOverview = z.infer<typeof MissionOverviewSchema>;
export type MissionSuggestion = z.infer<typeof MissionSuggestionSchema>;
export type MissionEvent = z.infer<typeof MissionEventSchema>;
export type MissionEventPage = z.infer<typeof MissionEventPageSchema>;
export type MissionDocument = z.infer<typeof MissionDocumentSchema>;
export type MissionCreate = z.input<typeof MissionCreateSchema>;
export type MissionUpdate = z.input<typeof MissionUpdateSchema>;
export type MissionStepComplete = z.input<typeof MissionStepCompleteSchema>;
export type MissionStepSkip = z.input<typeof MissionStepSkipSchema>;
export type MissionFollowUp = z.input<typeof MissionFollowUpSchema>;
export type MissionSuggestionAccept = z.input<typeof MissionSuggestionAcceptSchema>;
export type MissionSessionCreate = z.input<typeof MissionSessionCreateSchema>;
export type MissionSessionAttendance = z.input<typeof MissionSessionAttendanceSchema>;
export type MissionStepTaskCreate = z.input<typeof MissionStepTaskCreateSchema>;
export type UserLevel = z.infer<typeof UserLevelSchema>;
export type UserBadge = z.infer<typeof UserBadgeSchema>;
export type UserProgress = z.infer<typeof UserProgressSchema>;
export type MotivationPreferences = z.input<typeof MotivationPreferencesSchema>;
