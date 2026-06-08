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
    status: z.enum(["PENDIENTE", "PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI", "PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"]).default("PROGRAMADA"),
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
    status: z.enum(["PENDIENTE", "PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI", "PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"]).default("PROGRAMADA"),
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
export const MedicationSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    dosage: z.string(),
    frequency: z.number(),
    startDate: z.string(),
    firstIntakeTime: z.string(),
    endDate: z.string().nullable().optional(),
    indications: z.string().nullable().optional(),
    reminderOffsets: z.array(z.number()),
    treatmentId: z.string().uuid().nullable().optional(),
    createdBy: z.string().uuid().nullable().optional(),
    nextIntakeTime: z.string().nullable().optional(),
});

export const MedicationPageSchema = createPageSchema(MedicationSchema);

export const MedicationCreateSchema = z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.number().min(1),
    startDate: z.string(),
    firstIntakeTime: z.string(),
    endDate: z.string().optional(),
    indications: z.string().optional(),
    reminderOffsets: z.array(z.number()).default([]),
    treatmentId: z.string().uuid().optional(),
    nextIntakeTime: z.string().optional(),
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
export type Medication = z.infer<typeof MedicationSchema>;
export type MedicationPage = z.infer<typeof MedicationPageSchema>;
export type MedicationCreate = z.infer<typeof MedicationCreateSchema>;
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

