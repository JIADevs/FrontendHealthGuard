import { z, type ZodType } from "zod";

// Pagination schema factory — every paginated endpoint uses this pattern
export function createPageSchema<T extends ZodType>(itemSchema: T) {
    return z.object({
        items: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    });
}

// --- Auth ---
export const LoginRequestSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const SignupRequestSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    referralCode: z.string().optional(),
});

export const TokenResponseSchema = z
    .union([
        z.object({
            access_token: z.string(),
            refresh_token: z.string(),
            token_type: z.literal("bearer"),
        }),
        z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
            tokenType: z.literal("bearer"),
        }),
    ])
    .transform((value) => ({
        access_token: (value as any).access_token || (value as any).accessToken,
        refresh_token: (value as any).refresh_token || (value as any).refreshToken,
        token_type: (value as any).token_type || (value as any).tokenType,
    }));

// --- User ---
export const UserProfileSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    documentId: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    countryCode: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    emergencyContactName: z.string().nullable().optional(),
    emergencyContactPhone: z.string().nullable().optional(),
    bloodType: z.string().nullable().optional(),
    currentStreak: z.number().default(0),
    longestStreak: z.number().default(0),
    lastInteractionDate: z.string().nullable().optional(),
    points: z.number().default(0),
    referralCode: z.string().nullable().optional(),
});

export const UserUpdateSchema = z.object({
    name: z.string().optional(),
    documentId: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.string().optional(),
    countryCode: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    bloodType: z.string().optional(),
});

// --- Documents ---
export const DocumentTypeOutSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    subtypes: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
    specialties: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
});

export const TagValueOutSchema = z.object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    userId: z.string().uuid().nullable().optional(),
    value: z.string(),
});

export const TagCategoryOutSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid().nullable().optional(),
    name: z.string(),
    color: z.string().nullable().optional(),
    values: z.array(TagValueOutSchema),
});

export const DocumentSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    uploaderId: z.string().uuid().nullable().optional(),
    title: z.string(),
    description: z.string().nullable().optional(),
    fileUrl: z.string(),
    format: z.string(),
    fileSizeBytes: z.number().nullable().optional(),
    uploadedAt: z.string(),
    documentDate: z.string().nullable().optional(),
    treatmentId: z.string().uuid().nullable().optional(),
    documentType: DocumentTypeOutSchema.nullable().optional(),
    subtypes: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
    specialties: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
    customTags: z.array(TagValueOutSchema),
});

export const DocumentPageSchema = createPageSchema(DocumentSchema);

/** Enlace de compartir documento aún vigente (lista desde API). */
export const DocumentActiveShareSchema = z.object({
    linkId: z.string().uuid(),
    documentId: z.string().uuid(),
    documentTitle: z.string(),
    shareUrl: z.string(),
    qrCodeUrl: z.string(),
    expiresAt: z.string(),
    createdAt: z.string(),
});

export type DocumentActiveShare = z.infer<typeof DocumentActiveShareSchema>;

export const DocumentCreateSchema = z.object({
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional(),
    fileUrl: z.string(),
    format: z.string(),
    file_size_bytes: z.number().optional(),
    documentDate: z.string().optional(),
    treatmentId: z.string().uuid().optional(),
    typeId: z.string().uuid().optional(),
    subtypeIds: z.array(z.string().uuid()).optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    tagValueIds: z.array(z.string().uuid()).optional(),
});

export const CustomTagCreateSchema = z.object({
    categoryId: z.string().uuid(),
    value: z.string().min(1),
});

// --- Doctors ---
export const DoctorSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string(),
    specialty: z.string().nullable().optional(),
    clinic: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
});

export const DoctorPageSchema = createPageSchema(DoctorSchema);

export const DoctorCreateSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    specialty: z.string().optional(),
    clinic: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

// --- Treatments ---
export const TreatmentSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "INACTIVE"]).default("ACTIVE"),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
});
export const TreatmentPageSchema = createPageSchema(TreatmentSchema);

// --- Reminder config ---
export const ReminderConfigSchema = z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("DAILY"),
    interval: z.number().min(1).default(1),
    byDay: z.preprocess(
        (v) => {
            if (v === null || v === undefined) return undefined;
            if (typeof v === "string") return [v];
            return v;
        },
        z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])).optional(),
    ),
    endType: z.enum(["NEVER", "ON_DATE", "AFTER_N"]).default("NEVER"),
    endDate: z.string().optional(),
    endCount: z.number().min(1).optional(),
    time: z.string().default("09:00"),
});

// --- Appointments ---
export const AppointmentSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    createdBy: z.string().uuid().nullable().optional(),
    name: z.string().nullable().optional(),
    date: z.string().nullable().optional(),
    time: z.string().nullable().optional(),
    modality: z.enum(["PRESENCIAL", "VIRTUAL", "DOMICILIARIA"]).default("PRESENCIAL"),
    location: z.string().nullable().optional(),
    videoCallLink: z.string().nullable().optional(),
    specialty: z.string().nullable().optional(),
    service: z.string().nullable().optional(),
    consultationType: z.string().nullable().optional(),
    duration: z.number().nullable().optional(),
    doctorId: z.string().uuid().nullable().optional(),
    doctor: z.string().nullable().optional(),
    clinic: z.string().nullable().optional(),
    type: z.enum(["APPOINTMENT", "EXAM"]).default("APPOINTMENT"),
    status: z.enum(["PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI", "PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"]).default("PROGRAMADA"),
    examType: z.string().nullable().optional(),
    cost: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    customReminder: z.string().nullable().optional(),
    reminderConfig: ReminderConfigSchema.nullable().optional(),
    tags: z.array(z.string()).default([]),
    treatmentTags: z.array(z.string()).default([]),
    reminderOffsets: z.array(z.number()).default([]),
    treatmentId: z.string().uuid().nullable().optional(),
    treatmentIds: z.array(z.string().uuid()).default([]),
    preDocumentIds: z.array(z.string().uuid()).default([]),
    postDocumentIds: z.array(z.string().uuid()).default([]),
    preBackpackIds: z.array(z.string().uuid()).default([]),
    postBackpackIds: z.array(z.string().uuid()).default([]),
    createdAt: z.string().nullable().optional(),
});

export const AppointmentPageSchema = createPageSchema(AppointmentSchema);

export const AppointmentCreateSchema = z.object({
    name: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    modality: z.enum(["PRESENCIAL", "VIRTUAL", "DOMICILIARIA"]).default("PRESENCIAL"),
    location: z.string().optional(),
    videoCallLink: z.string().optional(),
    specialty: z.string().optional(),
    service: z.string().optional(),
    consultationType: z.string().optional(),
    duration: z.number().optional(),
    doctorId: z.string().uuid().optional(),
    doctor: z.string().optional(),
    clinic: z.string().optional(),
    type: z.enum(["APPOINTMENT", "EXAM"]).default("APPOINTMENT"),
    status: z.enum(["PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI", "PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"]).default("PROGRAMADA"),
    examType: z.string().optional(),
    cost: z.number().optional(),
    notes: z.string().optional(),
    customReminder: z.string().optional(),
    reminderConfig: ReminderConfigSchema.optional(),
    tags: z.array(z.string()).default([]),
    treatmentTags: z.array(z.string()).default([]),
    reminderOffsets: z.array(z.number()).default([]),
    treatmentId: z.string().uuid().optional(),
    treatmentIds: z.array(z.string().uuid()).default([]),
    preDocumentIds: z.array(z.string().uuid()).default([]),
    postDocumentIds: z.array(z.string().uuid()).default([]),
    preBackpackIds: z.array(z.string().uuid()).default([]),
    postBackpackIds: z.array(z.string().uuid()).default([]),
});


// --- Medications ---
export const MedicationIntakeSchema = z.object({
    id: z.string().uuid(),
    cycleId: z.string().uuid(),
    takenAt: z.string(),
});

export const MedicationDeliverySchema = z.object({
    id: z.string().uuid(),
    cycleId: z.string().uuid(),
    date: z.string(),
    quantity: z.number(),
    cost: z.number().nullable().optional(),
    source: z.string().nullable().optional(),
});

export const PHARMACEUTICAL_FORMS = ["TABLET", "CAPSULE", "CREAM", "PASTE", "SYRUP", "DROPS", "INJECTION", "POWDER", "SPRAY"] as const;
export type PharmaceuticalForm = typeof PHARMACEUTICAL_FORMS[number];

export const DOSE_UNITS = ["TABLET", "ML", "DROPS", "GRAMS", "MG", "UNITS"] as const;
export type DoseUnit = typeof DOSE_UNITS[number];

export const FREQUENCY_UNITS = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"] as const;
export type FrequencyUnit = typeof FREQUENCY_UNITS[number];

// --- Medications (identity + cycles; flat fields derived from active cycle for UI) ---

// Coerces Decimal strings from Pydantic v2 serialization to number
const coerceDecimal = z.preprocess(
    (v: unknown) => (v == null ? v : Number(v)),
    z.number().nullable().optional(),
);

export const MedicationCycleSchema = z.object({
    id: z.string().uuid(),
    medicationId: z.string().uuid(),
    treatmentIds: z.array(z.string().uuid()).default([]),
    replacesCycleId: z.string().uuid().nullable().optional(),
    dosage: z.string(),
    frequency: z.number(),
    // Use z.string() for new enum fields so unexpected values don't crash parsing
    frequencyUnit: z.string().default("HOUR"),
    pharmaceuticalForm: z.string().nullable().optional(),
    concentration: z.string().nullable().optional(),
    doseAmount: coerceDecimal,
    doseUnit: z.string().nullable().optional(),
    price: coerceDecimal,
    reason: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    startDate: z.string(),
    endDate: z.string().nullable().optional(),
    firstIntakeTime: z.string(),
    nextIntakeTime: z.string().nullable().optional(),

    reminderOffsets: z.array(z.number()),
    intakes: z.array(MedicationIntakeSchema).default([]),
    deliveries: z.array(MedicationDeliverySchema).default([]),
});


export type MedicationCycle = z.infer<typeof MedicationCycleSchema>;

function pickActiveMedicationCycle(cycles: MedicationCycle[]): MedicationCycle | undefined {
    if (cycles.length === 0) return undefined;
    const now = Date.now();
    const active = cycles.find((cycle) => {
        const start = new Date(cycle.startDate).getTime();
        const end = cycle.endDate ? new Date(cycle.endDate).getTime() : Number.POSITIVE_INFINITY;
        return start <= now && now <= end;
    });
    return active ?? cycles[cycles.length - 1];
}

export const MedicationSchema = z
    .object({
        id: z.string().uuid(),
        userId: z.string().uuid().optional(),
        name: z.string(),
        createdBy: z.string().uuid().nullable().optional(),
        cycles: z.array(MedicationCycleSchema).default([]),
    })
    .transform((med) => {
        const cycle = pickActiveMedicationCycle(med.cycles);
        return {
            ...med,
            dosage: cycle?.dosage ?? "",
            doseAmount: cycle?.doseAmount ?? null,
            doseUnit: cycle?.doseUnit ?? null,
            frequency: cycle?.frequency ?? 0,
            frequencyUnit: cycle?.frequencyUnit ?? "HOUR",
            startDate: cycle?.startDate ?? "",
            firstIntakeTime: cycle?.firstIntakeTime ?? "",
            endDate: cycle?.endDate ?? null,
            indications: cycle?.notes ?? null,
            reminderOffsets: cycle?.reminderOffsets ?? [],
            treatmentIds: cycle?.treatmentIds ?? [],
            nextIntakeTime: cycle?.nextIntakeTime ?? null,
        };
    });

export const MedicationPageSchema = createPageSchema(MedicationSchema);

export const MedicationCreateSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
});

export const MedicationUpdateSchema = z.object({
    name: z.string().min(1).optional(),
});

export const MedicationCycleCreateSchema = z.object({
    dosage: z.string().min(1, "La dosis es obligatoria"),
    frequency: z.number().min(1),
    frequencyUnit: z.enum(FREQUENCY_UNITS).default("HOUR"),
    pharmaceuticalForm: z.enum(PHARMACEUTICAL_FORMS).optional(),
    concentration: z.string().optional(),
    doseAmount: z.number().optional(),
    doseUnit: z.enum(DOSE_UNITS).optional(),
    price: z.number().optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    firstIntakeTime: z.string(),
    nextIntakeTime: z.string().optional(),
    reminderOffsets: z.array(z.number()).default([]),
    treatmentIds: z.array(z.string().uuid()).default([]),
    replacesCycleId: z.string().uuid().optional(),
});

export const MedicationCycleUpdateSchema = z.object({
    dosage: z.string().min(1).optional(),
    frequency: z.number().min(1).optional(),
    frequencyUnit: z.enum(FREQUENCY_UNITS).optional(),
    pharmaceuticalForm: z.enum(PHARMACEUTICAL_FORMS).nullable().optional(),
    concentration: z.string().nullable().optional(),
    doseAmount: z.number().nullable().optional(),
    doseUnit: z.enum(DOSE_UNITS).nullable().optional(),
    price: z.number().nullable().optional(),
    reason: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    nextIntakeTime: z.string().nullable().optional(),
    reminderOffsets: z.array(z.number()).optional(),
    treatmentIds: z.array(z.string().uuid()).optional(),
});

// --- Notifications ---
export const NotificationSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    type: z.enum(["APPOINTMENT", "MEDICATION", "CHECKIN", "SYSTEM", "INFO"]),
    entityId: z.string().uuid().nullable(),
    isRead: z.boolean(),
    createdAt: z.string(),
});

export const NotificationPageSchema = createPageSchema(NotificationSchema);

// --- AI Classification ---
export const ClassificationSuggestionSchema = z.object({
    type: z
        .object({ id: z.string().uuid(), name: z.string() })
        .nullable()
        .optional(),
    subtypes: z.array(z.object({ id: z.string().uuid(), name: z.string() })).nullable().default([]),
    specialties: z.array(z.object({ id: z.string().uuid(), name: z.string() })).nullable().default([]),
    customTags: z.array(
        z.object({
            categoryId: z.string().uuid(),
            categoryName: z.string().nullable().optional(),
            tagValueId: z.string().uuid(),
            tagValueName: z.string().nullable().optional(),
        })
    ).nullable().default([]),
    newTags: z.array(
        z.object({
            categoryId: z.string().uuid(),
            categoryName: z.string().nullable().optional(),
            value: z.string(),
        })
    ).nullable().default([]),
    title: z.string().nullable().optional(),
});

// --- Backpacks ---
export const BackpackSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    type: z.enum(["CUSTOM", "TEMPORARY_SHARE"]).default("CUSTOM"),
    documentCount: z.number().nullish().default(0),
    createdAt: z.string(),
});

export const BackpackWithDocsSchema = BackpackSchema.extend({
    documents: z.array(DocumentSchema),
});

export const BackpackPageSchema = createPageSchema(BackpackSchema);

export const BackpackCreateSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
    type: z.enum(["CUSTOM", "TEMPORARY_SHARE"]).default("CUSTOM"),
});

// --- Daily Check-Ins ---

export const MOOD_ENUM_VALUES = ["excellent", "good", "okay", "bad", "awful"] as const;
export type MoodEnum = typeof MOOD_ENUM_VALUES[number];

export const DailyCheckInSchema = z.object({
    id:         z.string().uuid(),
    userId:     z.string().uuid(),
    createdBy:  z.string().uuid().nullable().optional(),
    mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
    recordedAt: z.string(),
    notes:      z.string().nullable().optional(),
});

export const DailyCheckInCreateSchema = z.object({
    mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
    recordedAt: z.string(),
    notes:      z.string().optional(),
});

export const DailyCheckInUpdateSchema = DailyCheckInCreateSchema.partial();

export const DailyCheckInPageSchema = createPageSchema(DailyCheckInSchema);

const CalendarDayPayloadSchema = z.object({
    appointments: z.array(AppointmentSchema).default([]),
    medications:  z.array(MedicationSchema).default([]),
    symptoms:     z.array(z.unknown()).default([]),
    checkIns:     z.array(DailyCheckInSchema).default([]),
});

export const CalendarDaySchema = CalendarDayPayloadSchema.extend({
    date: z.string(),
});

export type CalendarDay = z.infer<typeof CalendarDaySchema>;

export function parseCalendarEventsResponse(data: unknown): CalendarDay[] {
    const record = z.record(z.string(), CalendarDayPayloadSchema).parse(data);
    return Object.entries(record)
        .map(([date, day]) => CalendarDaySchema.parse({ date, ...day }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

// --- Delegation ---

export const DelegationStatusSchema = z.enum(["PENDING", "ACTIVE", "REJECTED", "REVOKED"]);
export const DelegationRelationshipSchema = z.enum(["I_WANT_TO_MANAGE_THEM", "THEY_WILL_MANAGE_ME"]);

export const DelegationRequestSchema = z.object({
    email: z.string().email("Email inválido"),
    relationship: DelegationRelationshipSchema,
    permissions: z.literal("FULL_ACCESS"),
});

const NestedDelegationProfileSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
}).nullable().optional();

const DelegationBaseSchema = z.object({
    id: z.string(),
    managerUserId: z.string(),
    dependentUserId: z.string().nullable(),
    status: DelegationStatusSchema,
    permissions: z.string(),
    linkedUserEmail: z.string().nullable().optional(),
    createdAt: z.string(),
    revokedAt: z.string().nullable().optional(),
});

export const DependentDelegationSchema = DelegationBaseSchema.extend({
    dependent: NestedDelegationProfileSchema,
}).transform((d) => ({
    ...d,
    linkedUserEmail: d.linkedUserEmail ?? d.dependent?.email ?? "",
    linkedUserName: d.dependent?.name ?? null,
}));

export const ManagerDelegationSchema = DelegationBaseSchema.extend({
    manager: NestedDelegationProfileSchema,
}).transform((d) => ({
    ...d,
    linkedUserEmail: d.linkedUserEmail ?? d.manager?.email ?? "",
    linkedUserName: d.manager?.name ?? null,
}));

export type DelegationContextColors = Record<string, string>;

// --- Inferred types ---
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentPage = z.infer<typeof DocumentPageSchema>;
export type DocumentCreate = z.infer<typeof DocumentCreateSchema>;
export type DocumentTypeOut = z.infer<typeof DocumentTypeOutSchema>;
export type TagCategoryOut = z.infer<typeof TagCategoryOutSchema>;
export type Doctor = z.infer<typeof DoctorSchema>;
export type DoctorPage = z.infer<typeof DoctorPageSchema>;
export type DoctorCreate = z.infer<typeof DoctorCreateSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentPage = z.infer<typeof AppointmentPageSchema>;
export type AppointmentCreate = z.infer<typeof AppointmentCreateSchema>;
export type MedicationIntake = z.infer<typeof MedicationIntakeSchema>;
export type MedicationDelivery = z.infer<typeof MedicationDeliverySchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type MedicationPage = z.infer<typeof MedicationPageSchema>;
export type MedicationCreate = z.infer<typeof MedicationCreateSchema>;
export type MedicationUpdate = z.infer<typeof MedicationUpdateSchema>;
export type MedicationCycleCreate = z.infer<typeof MedicationCycleCreateSchema>;
export type MedicationCycleUpdate = z.infer<typeof MedicationCycleUpdateSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPage = z.infer<typeof NotificationPageSchema>;
export type ClassificationSuggestion = z.infer<typeof ClassificationSuggestionSchema>;
export type Backpack = z.infer<typeof BackpackSchema>;
export type BackpackWithDocs = z.infer<typeof BackpackWithDocsSchema>;
export type BackpackPage = z.infer<typeof BackpackPageSchema>;
export type BackpackCreate = z.infer<typeof BackpackCreateSchema>;
export type CustomTagCreate = z.infer<typeof CustomTagCreateSchema>;
export type Treatment = z.infer<typeof TreatmentSchema>;
export type TreatmentPage = z.infer<typeof TreatmentPageSchema>;
export type ReminderConfig = z.infer<typeof ReminderConfigSchema>;
export type DailyCheckIn = z.infer<typeof DailyCheckInSchema>;
export type DailyCheckInCreate = z.infer<typeof DailyCheckInCreateSchema>;
export type DailyCheckInUpdate = z.infer<typeof DailyCheckInUpdateSchema>;
export type DailyCheckInPage = z.infer<typeof DailyCheckInPageSchema>;
export type DelegationStatus = z.infer<typeof DelegationStatusSchema>;
export type DelegationRelationship = z.infer<typeof DelegationRelationshipSchema>;
export type DelegationRequest = z.infer<typeof DelegationRequestSchema>;
export type DependentDelegation = z.infer<typeof DependentDelegationSchema>;
export type ManagerDelegation = z.infer<typeof ManagerDelegationSchema>;

