import { apiClient } from "./client";
import { z } from "zod";
import {
    listShares,
    revokeShare,
    shareBackpackWithOptions,
    shareDocumentWithOptions,
    getSharedDocumentSignedUrlViewOnly,
} from "./shares/endpoints";
import type { ShareCreateOptions } from "./shares/schemas";
import {
    TokenResponseSchema,
    UserProfileSchema,
    DocumentPageSchema,
    DocumentSchema,
    DocumentActiveShareSchema,
    AppointmentPageSchema,
    AppointmentSchema,
    TreatmentPageSchema,
    TreatmentSchema,
    DoctorPageSchema,
    MedicationPageSchema,
    NotificationPageSchema,
    BackpackPageSchema,
    BackpackSchema,
    ClassificationSuggestionSchema,
    DailyCheckInSchema,
    DailyCheckInPageSchema,
    parseCalendarEventsResponse,
    type CalendarDay,
    type DailyCheckInUpdate,
    type LoginRequest,
    type SignupRequest,
    type UserUpdate,
    type DocumentCreate,
    type AppointmentCreate,
    type MedicationCreate,
    type DoctorCreate,
    type BackpackCreate,
    type CustomTagCreate,
    type DailyCheckInCreate,
    type DailyCheckInPage,
} from "./schemas";

// ─── Auth ──────────────────────────────────────────────

export async function login(credentials: LoginRequest) {
    const { data } = await apiClient.post("/auth/login", credentials);
    return TokenResponseSchema.parse(data);
}

export async function signup(userData: SignupRequest) {
    const { data } = await apiClient.post("/auth/signup", userData);
    return data as { message: string; user: { id: string; email: string } };
}

export async function refreshAccessToken(refreshToken: string) {
    const { data } = await apiClient.post("/auth/refresh", {
        refresh_token: refreshToken,
    });
    return TokenResponseSchema.parse(data);
}

// ─── Users ─────────────────────────────────────────────

export async function getMe() {
    const { data } = await apiClient.get("/users/me");
    return UserProfileSchema.parse(data);
}

export async function updateMe(userData: UserUpdate) {
    const { data } = await apiClient.patch("/users/me", userData);
    return UserProfileSchema.parse(data);
}

export async function getPreference(key: string) {
    const { data } = await apiClient.get(`/users/me/preferences/${key}`);
    return data as { value: unknown };
}

export async function setPreference(key: string, value: unknown) {
    const { data } = await apiClient.put(`/users/me/preferences/${key}`, {
        value,
    });
    return data;
}

// ─── Documents ─────────────────────────────────────────

export async function getDocuments(params: {
    page?: number;
    limit?: number;
    searchQuery?: string;
    startDate?: string;
    endDate?: string;
}) {
    const { data } = await apiClient.get("/documents/", { params });
    return DocumentPageSchema.parse(data);
}

export async function getDocumentById(id: string) {
    const { data } = await apiClient.get(`/documents/${id}`);
    return data;
}

export async function createDocument(doc: DocumentCreate) {
    const { data } = await apiClient.post("/documents/", doc);
    return DocumentSchema.parse(data);
}

export async function updateDocument(id: string, doc: DocumentCreate) {
    const { data } = await apiClient.put(`/documents/${id}`, doc);
    return DocumentSchema.parse(data);
}

export async function deleteDocument(id: string) {
    await apiClient.delete(`/documents/${id}`);
}

export async function getDocumentTypes() {
    const { data } = await apiClient.get("/documents/catalog/types");
    return data;
}

export async function getTagCategories() {
    const { data } = await apiClient.get("/documents/tags/categories");
    return data;
}

/** Add a value to an existing tag category. Returns the created tag value (use .id for tagValueIds). */
export async function createCustomTag(tag: CustomTagCreate) {
    const { data } = await apiClient.post(`/documents/tags/categories/${tag.categoryId}/values`, { value: tag.value });
    return data as { id: string; categoryId?: string; value: string };
}

/** Create a new tag category (e.g. "Médico", "Institución"). */
export async function createTagCategory(body: { name: string; color?: string }) {
    const { data } = await apiClient.post("/documents/tags/categories", body);
    return data;
}

/** Add a value to a tag category. Returns the created tag value. */
export async function addTagValue(categoryId: string, value: string) {
    const { data } = await apiClient.post(`/documents/tags/categories/${categoryId}/values`, { value });
    return data as { id: string; categoryId?: string; value: string };
}

export async function shareDocument(id: string, expiresIn: ShareCreateOptions["expiresIn"] = "24h") {
    return shareDocumentWithOptions(id, { expiresIn });
}

/** @deprecated Prefer listShares from `./shares` */
export async function getActiveDocumentShares() {
    const items = await listShares("active");
    return items
        .filter((item) => item.resourceType === "document")
        .map((item) => ({
            linkId: item.linkId,
            documentId: item.resourceId,
            documentTitle: item.title,
            shareUrl: item.shareUrl,
            qrCodeUrl: item.qrCodeUrl,
            expiresAt: item.expiresAt ?? "",
            createdAt: item.createdAt,
        }));
}

/** Revoca un enlace activo (solo el dueño del documento). */
export async function revokeDocumentShare(linkId: string) {
    await revokeShare(linkId, "document");
}

/** Load document metadata for a public share link (no auth required; token is the capability). */
export async function consumeSharedDocument(token: string) {
    const { data } = await apiClient.get("/documents/shared/consume", { params: { token } });
    return DocumentSchema.parse(data);
}

/** Signed URL to preview a shared file (view-only; no download). */
export async function getSharedDocumentSignedUrl(token: string, expiresInSeconds = 3600) {
    return getSharedDocumentSignedUrlViewOnly(token, expiresInSeconds);
}

// ─── Files ─────────────────────────────────────────────

export async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data as { storagePath: string };
}

// React Native / mobile helper: upload from URI (expo-camera, image picker, etc.)
export async function uploadFileFromUri(
    uri: string,
    name: string,
    mimeType: string,
    onProgress?: (percent: number) => void,
) {
    const formData = new FormData();
    // In React Native, the "file" can be an object with uri/name/type
    formData.append("file", { uri, name, type: mimeType } as any);
    const { data } = await apiClient.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
            const total = event.total ?? 0;
            if (total > 0) {
                onProgress?.(Math.min(100, Math.round((event.loaded / total) * 100)));
            }
        },
    });
    return data as { storagePath: string };
}

export async function getSignedUrl(path: string) {
    const encoded = encodeURIComponent(path);
    const { data } = await apiClient.get(`/files/url?path=${encoded}`);
    return data as { url: string; expiresAt: string };
}

// ─── Appointments ──────────────────────────────────────

export async function getAppointments(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
}) {
    const { data } = await apiClient.get("/appointments/", { params });
    return AppointmentPageSchema.parse(data);
}

export async function getAppointmentById(id: string) {
    const { data } = await apiClient.get(`/appointments/${id}`);
    return AppointmentSchema.parse(data);
}

export async function createAppointment(appt: AppointmentCreate) {
    const { data } = await apiClient.post("/appointments/", appt);
    return data;
}

export async function updateAppointment(id: string, appt: AppointmentCreate) {
    const { data } = await apiClient.put(`/appointments/${id}`, appt);
    return data;
}

export async function deleteAppointment(id: string) {
    await apiClient.delete(`/appointments/${id}`);
}

export async function updateAppointmentStatus(
    id: string,
    status: string
) {
    const { data } = await apiClient.patch(`/appointments/${id}/status`, {
        status,
    });
    return data;
}

export async function getAppointmentOptions() {
    const { data } = await apiClient.get("/appointments/options/all");
    return {
        specialties: (data.specialties ?? []) as string[],
        services: (data.services ?? []) as string[],
        consultation_types: (data.consultation_types ?? data.consultationTypes ?? []) as string[],
    };
}

// ─── Treatments ────────────────────────────────────────

export async function getTreatments(params: { page?: number; limit?: number } = {}) {
    const { data } = await apiClient.get("/treatments/", { params });
    return TreatmentPageSchema.parse(data);
}

export async function getTreatmentById(id: string) {
    const { data } = await apiClient.get(`/treatments/${id}`);
    return TreatmentSchema.parse(data);
}

// ─── Medications ───────────────────────────────────────

export async function getMedications(params: {
    page?: number;
    limit?: number;
}) {
    const { data } = await apiClient.get("/medications/", { params });
    return MedicationPageSchema.parse(data);
}

export async function createMedication(med: MedicationCreate) {
    const { data } = await apiClient.post("/medications/", med);
    return data;
}

export async function updateMedication(id: string, med: MedicationCreate) {
    const { data } = await apiClient.put(`/medications/${id}`, med);
    return data;
}

export async function deleteMedication(id: string) {
    await apiClient.delete(`/medications/${id}`);
}

export async function confirmIntake(id: string) {
    const { data } = await apiClient.post(`/medications/${id}/intakes`, {
        taken_at: new Date().toISOString(),
    });
    return data;
}

// ─── Doctors ───────────────────────────────────────────

export async function getDoctors(params: {
    page?: number;
    limit?: number;
    searchQuery?: string;
}) {
    const { data } = await apiClient.get("/doctors/", { params });
    return DoctorPageSchema.parse(data);
}

export async function createDoctor(doctor: DoctorCreate) {
    const { data } = await apiClient.post("/doctors/", doctor);
    return data;
}

export async function updateDoctor(id: string, doctor: DoctorCreate) {
    const { data } = await apiClient.put(`/doctors/${id}`, doctor);
    return data;
}

export async function deleteDoctor(id: string) {
    await apiClient.delete(`/doctors/${id}`);
}


// ─── Notifications ─────────────────────────────────────

export async function getNotifications(params: {
    page?: number;
    limit?: number;
}) {
    const { data } = await apiClient.get("/notifications/", { params });
    return NotificationPageSchema.parse(data);
}

export async function markNotificationAsRead(id: string) {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return data;
}

export async function registerDeviceToken(
    token: string,
    deviceType: string
) {
    const { data } = await apiClient.post("/notifications/devices", {
        token,
        deviceType,
    });
    return data;
}

// ─── Calendar ──────────────────────────────────────────

export async function getCalendarEvents(startDate: string, endDate: string): Promise<CalendarDay[]> {
    const { data } = await apiClient.get("/calendar/events", {
        params: { startDate, endDate },
    });
    return parseCalendarEventsResponse(data);
}

// ─── AI Classification ────────────────────────────────

export async function classifyDocument(file: File | Blob) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post("/documents/classify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
    });
    return ClassificationSuggestionSchema.parse(data);
}

export async function classifyDocumentFromUri(uri: string, name: string, mimeType: string) {
    const formData = new FormData();
    formData.append("file", { uri, name, type: mimeType } as any);
    const { data } = await apiClient.post("/documents/classify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
    });
    return ClassificationSuggestionSchema.parse(data);
}

// ─── Daily Check-Ins ───────────────────────────────────

export async function getDailyCheckIns(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
}): Promise<DailyCheckInPage> {
    const { data } = await apiClient.get("/daily-checkins/", { params });
    return DailyCheckInPageSchema.parse(data);
}

export async function createDailyCheckIn(payload: DailyCheckInCreate) {
    const { data } = await apiClient.post("/daily-checkins/", payload);
    return DailyCheckInSchema.parse(data);
}

export async function updateDailyCheckIn(id: string, payload: DailyCheckInUpdate) {
    const { data } = await apiClient.patch(`/daily-checkins/${id}`, payload);
    return DailyCheckInSchema.parse(data);
}

export async function deleteDailyCheckIn(id: string) {
    await apiClient.delete(`/daily-checkins/${id}`);
}

// ─── Backpacks ─────────────────────────────────────────
export async function getBackpacks(params: { page?: number; limit?: number; searchQuery?: string }) {
    const { data } = await apiClient.get("/backpacks/", { params });
    return BackpackPageSchema.parse(data);
}

export async function getBackpackById(id: string) {
    const { data } = await apiClient.get(`/backpacks/${id}`);
    return BackpackSchema.parse(data);
}

export async function createBackpack(bp: BackpackCreate) {
    const { data } = await apiClient.post("/backpacks/", bp);
    return BackpackSchema.parse(data);
}

export async function updateBackpack(id: string, bp: BackpackCreate) {
    const { data } = await apiClient.put(`/backpacks/${id}`, bp);
    return data;
}

export async function deleteBackpack(id: string) {
    await apiClient.delete(`/backpacks/${id}`);
}

export async function addDocToBackpack(backpackId: string, documentId: string) {
    const { data } = await apiClient.post(`/backpacks/${backpackId}/documents`, { documentId });
    return data;
}

export async function removeDocFromBackpack(backpackId: string, documentId: string) {
    await apiClient.delete(`/backpacks/${backpackId}/documents/${documentId}`);
}

export async function shareBackpack(id: string, expiresIn: ShareCreateOptions["expiresIn"] = "24h") {
    return shareBackpackWithOptions(id, { expiresIn });
}

export async function getBackpackDocuments(params: {
    backpackId: string;
    page?: number;
    limit?: number;
    searchQuery?: string;
}) {
    const { backpackId, ...rest } = params;
    const { data } = await apiClient.get(`/backpacks/${backpackId}/documents`, { params: rest });
    return DocumentPageSchema.parse(data);
}

