import { apiClient } from "./client";
import {
    TokenResponseSchema,
    UserProfileSchema,
    DocumentPageSchema,
    AppointmentPageSchema,
    MedicationPageSchema,
    NotificationPageSchema,
    type LoginRequest,
    type SignupRequest,
    type UserUpdate,
    type DocumentCreate,
    type AppointmentCreate,
    type MedicationCreate,
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
    return data;
}

export async function deleteDocument(id: string) {
    await apiClient.delete(`/documents/${id}`);
}

export async function getDocumentTypes() {
    const { data } = await apiClient.get("/documents/types");
    return data;
}

export async function getTagCategories() {
    const { data } = await apiClient.get("/documents/tags");
    return data;
}

export async function shareDocument(id: string) {
    const { data } = await apiClient.post(`/documents/${id}/share`);
    return data as { token: string; url: string; expiresAt: string };
}

// ─── Files ─────────────────────────────────────────────

export async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data as { fileUrl: string };
}

export async function getSignedUrl(path: string) {
    const encoded = encodeURIComponent(path);
    const { data } = await apiClient.get(`/files/${encoded}/signed-url`);
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
    const { data } = await apiClient.post(`/medications/${id}/intake`);
    return data;
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
    const { data } = await apiClient.patch(`/notifications/${id}`, {
        isRead: true,
    });
    return data;
}

export async function registerDeviceToken(
    token: string,
    deviceType: string
) {
    const { data } = await apiClient.post("/notifications/device-token", {
        token,
        deviceType,
    });
    return data;
}

// ─── Calendar ──────────────────────────────────────────

export async function getCalendarEvents(startDate: string, endDate: string) {
    const { data } = await apiClient.get("/calendar/", {
        params: { startDate, endDate },
    });
    return data;
}

// ─── AI Classification ────────────────────────────────

export async function classifyDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post("/documents/classify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}
