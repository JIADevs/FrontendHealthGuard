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

export const DocumentCreateSchema = z.object({
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional(),
    fileUrl: z.string(),
    format: z.string(),
    fileSizeBytes: z.number().optional(),
    documentDate: z.string().optional(),
    treatmentId: z.string().uuid().optional(),
    typeId: z.string().uuid().optional(),
    subtypeIds: z.array(z.string().uuid()).optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    tagValueIds: z.array(z.string().uuid()).optional(),
});

// --- Appointments ---
export const AppointmentSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    createdBy: z.string().uuid().nullable().optional(),
    date: z.string(),
    time: z.string(),
    specialty: z.string(),
    doctor: z.string(),
    location: z.string(),
    type: z.enum(["APPOINTMENT", "EXAM"]),
    status: z.enum(["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"]),
    examType: z.string().nullable().optional(),
    tags: z.array(z.string()),
    reminderOffsets: z.array(z.number()),
    treatmentId: z.string().uuid().nullable().optional(),
    createdAt: z.string().nullable().optional(),
});

export const AppointmentPageSchema = createPageSchema(AppointmentSchema);

export const AppointmentCreateSchema = z.object({
    date: z.string(),
    time: z.string(),
    specialty: z.string().min(1),
    doctor: z.string().min(1),
    location: z.string().min(1),
    type: z.enum(["APPOINTMENT", "EXAM"]),
    status: z.enum(["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"]).default("PENDING"),
    examType: z.string().optional(),
    tags: z.array(z.string()).default([]),
    reminderOffsets: z.array(z.number()).default([]),
    treatmentId: z.string().uuid().optional(),
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
    subtypes: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
    specialties: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
    custom_tags: z.array(
        z.object({
            category_id: z.string().uuid(),
            category_name: z.string().nullable().optional(),
            tag_value_id: z.string().uuid(),
            tag_value_name: z.string().nullable().optional(),
        })
    ),
    new_tags: z.array(
        z.object({
            category_id: z.string().uuid(),
            category_name: z.string().nullable().optional(),
            value: z.string(),
        })
    ),
});

// --- Backpacks ---
export const BackpackSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    type: z.enum(["CUSTOM", "TEMPORARY_SHARE"]),
    documentCount: z.number().default(0),
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

