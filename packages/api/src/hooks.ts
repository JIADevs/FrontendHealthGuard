
/**
 * Shared TanStack Query hooks — usable on both web (Next.js) and mobile (Expo).
 *
 * Pattern:
 *  - Query hooks  → handle cache keys, staleTime, placeholderData
 *  - Mutation hooks → handle cache invalidation in onSettled
 *    The caller adds platform-specific toast/navigation via mutate(data, { onSuccess, onError })
 */
import {
    keepPreviousData,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    // Documents
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    getActiveDocumentShares,
    revokeDocumentShare,
    getDocumentTypes,
    getTagCategories,
    // Backpacks
    getBackpacks,
    getBackpackById,
    createBackpack,
    updateBackpack,
    deleteBackpack,
    addDocToBackpack,
    removeDocFromBackpack,
    getBackpackDocuments,
        // Doctors
    getDoctors,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    // Appointments
    getAppointments,
    getAppointmentById,
    createAppointment,
    // Treatments
    getTreatmentById,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    getAppointmentOptions,
    // Treatments
    getTreatments,
    // Medications
    getMedications,
    createMedication,
    createMedicationCycle,
    updateMedication,
    deleteMedication,
    confirmIntake,
    // Notifications
    getNotifications,
    markNotificationAsRead,
    // Calendar
    getCalendarEvents,
    // User
    getMe,
    updateMe,
    // Delegations
    getManagedUsers,
    getManagers,
    createDelegation,
    respondDelegation,
    revokeDelegation,
    updateDelegationContextColors,
} from "./endpoints";
import type {
    DocumentCreate,
    DocumentActiveShare,
    AppointmentCreate,
    MedicationCycleCreate,
    DoctorCreate,
    BackpackCreate,
    UserUpdate,
    DelegationRequest,
    DelegationContextColors,
} from "./schemas";
import type { ShareStatusFilter } from "./shares/schemas";
import { invalidateBackpackQueries } from "./backpackQueryUtils";
import {
    useSharesQuery,
    useShareDocumentMutation as useShareDocumentMutationCore,
    useRevokeShareMutation,
    useExtendShareMutation,
    invalidateShareQueries,
    shareQK,
} from "./shares/hooks";

// ─── Query keys ────────────────────────────────────────
// Centralized so invalidation is always consistent.
export const QK = {
    /** Incluye `limit` en la key: el dashboard pide p. ej. limit=1 y la lista otro tamaño; sin esto comparten caché y la lista queda corta. */
    documents:        (
        search = "",
        page = 1,
        limit = 20,
        startDate: string | null = null,
        endDate: string | null = null,
    ) => ["documents", page, search, limit, startDate, endDate] as const,
    document:         (id: string)            => ["document", id] as const,
    documentTypes:    ()                      => ["document-types"] as const,
    tagCategories:    ()                      => ["tag-categories"] as const,

    backpacks:        (search = "")           => ["backpacks", search] as const,
    backpack:         (id: string)            => ["backpack", id] as const,
    backpackDocs:     (id: string, search = "", page = 1) => ["backpack-docs", id, page, search] as const,
    backpackDocIds:   (id: string)            => ["backpack-doc-ids", id] as const,
     doctors:          (search = "", page = 1, limit = 50) => ["doctors", page, search, limit] as const,

    /** Incluye `limit` y rango de fechas: el dashboard usa limit pequeño y `startDate`; la agenda usa otros parámetros. */
    appointments:     (search = "", page = 1, limit = 20, startDate: string | null = null, endDate: string | null = null) =>
        ["appointments", page, search, limit, startDate, endDate] as const,
    appointment:      (id: string)             => ["appointment", id] as const,

    treatments:       (page = 1, limit = 100) => ["treatments", page, limit] as const,
    treatment:        (id: string)            => ["treatment", id] as const,

    medications:      (page = 1, limit = 20) => ["medications", page, limit] as const,

    notifications:    (page = 1)              => ["notifications", page] as const,

    calendar:         (start: string, end: string) => ["calendar", start, end] as const,

    profile:          ()                      => ["me"] as const,

    documentSharesActive: () => ["document-shares-active"] as const,
    shares: (status: ShareStatusFilter = "all") => ["shares", status] as const,
} as const;

// ─── Documents ─────────────────────────────────────────

export function useDocumentsQuery(
    search = "",
    page = 1,
    limit = 20,
    startDate: string | null = null,
    endDate: string | null = null,
) {
    return useQuery({
        queryKey: QK.documents(search, page, limit, startDate, endDate),
        queryFn: () =>
            getDocuments({
                page,
                limit,
                searchQuery: search || undefined,
                startDate: startDate ?? undefined,
                endDate: endDate ?? undefined,
            }),
        staleTime: 5_000,
        placeholderData: keepPreviousData,
    });
}

export function useActiveDocumentSharesQuery() {
    return useQuery({
        queryKey: QK.documentSharesActive(),
        queryFn: () => getActiveDocumentShares(),
        staleTime: 30_000,
    });
}

export function useShareDocumentMutation() {
    return useShareDocumentMutationCore();
}

export function useRevokeDocumentShareMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (linkId: string) => revokeDocumentShare(linkId),
        onSuccess: (_, linkId) => {
            qc.setQueryData<DocumentActiveShare[]>(QK.documentSharesActive(), (old) =>
                old ? old.filter((r) => r.linkId !== linkId) : old,
            );
            invalidateShareQueries(qc);
        },
    });
}

export {
    useSharesQuery,
    useShareHistoryQuery,
    useShareBackpackMutation,
    useRevokeShareMutation,
    useExtendShareMutation,
    invalidateShareQueries,
    shareQK,
} from "./shares/hooks";

export function useDocumentQuery(id: string) {
    return useQuery({
        queryKey: QK.document(id),
        queryFn: () => getDocumentById(id),
        enabled: !!id,
        staleTime: 30_000,
    });
}

export function useDocumentTypesQuery() {
    return useQuery({
        queryKey: QK.documentTypes(),
        queryFn: getDocumentTypes,
        staleTime: Infinity,
    });
}

export function useTagCategoriesQuery() {
    return useQuery({
        queryKey: QK.tagCategories(),
        queryFn: getTagCategories,
        staleTime: Infinity,
    });
}

export function useCreateDocumentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (doc: DocumentCreate) => createDocument(doc),
        onSettled: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    });
}

export function useUpdateDocumentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, doc }: { id: string; doc: DocumentCreate }) => updateDocument(id, doc),
        onSettled: (_data, _err, vars) => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            qc.invalidateQueries({ queryKey: QK.document(vars.id) });
        },
    });
}

export function useDeleteDocumentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDocument(id),
        onSettled: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    });
}

// ─── Backpacks ─────────────────────────────────────────

export function useBackpacksQuery(search = "", limit = 20) {
    return useQuery({
        queryKey: QK.backpacks(search),
        queryFn: () => getBackpacks({ page: 1, limit, searchQuery: search || undefined }),
        staleTime: 5_000,
        placeholderData: keepPreviousData,
    });
}

export function useBackpackQuery(id: string) {
    return useQuery({
        queryKey: QK.backpack(id),
        queryFn: () => getBackpackById(id),
        enabled: !!id,
        staleTime: 30_000,
    });
}

export function useBackpackDocumentsQuery(backpackId: string, search = "", page = 1, limit = 20) {
    return useQuery({
        queryKey: QK.backpackDocs(backpackId, search, page),
        queryFn: () => getBackpackDocuments({ backpackId, page, limit, searchQuery: search || undefined }),
        enabled: !!backpackId,
        staleTime: 5_000,
    });
}

export function useCreateBackpackMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (bp: BackpackCreate) => createBackpack(bp),
        onSettled: () => qc.invalidateQueries({ queryKey: ["backpacks"] }),
    });
}

export function useUpdateBackpackMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, bp }: { id: string; bp: BackpackCreate }) => updateBackpack(id, bp),
        onSettled: (_data, _err, vars) => {
            qc.invalidateQueries({ queryKey: ["backpacks"] });
            qc.invalidateQueries({ queryKey: QK.backpack(vars.id) });
        },
    });
}

export function useDeleteBackpackMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteBackpack(id),
        onSettled: () => qc.invalidateQueries({ queryKey: ["backpacks"] }),
    });
}

export function useAddDocToBackpackMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ backpackId, documentId }: { backpackId: string; documentId: string }) =>
            addDocToBackpack(backpackId, documentId),
        onSettled: (_data, _err, vars) => {
            invalidateBackpackQueries(qc, vars.backpackId);
        },
    });
}

export function useRemoveDocFromBackpackMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ backpackId, documentId }: { backpackId: string; documentId: string }) =>
            removeDocFromBackpack(backpackId, documentId),
        onSettled: (_data, _err, vars) => {
            invalidateBackpackQueries(qc, vars.backpackId);
        },
    });
}

// ─── Appointments ──────────────────────────────────────

export function useAppointmentByIdQuery(id: string) {
    return useQuery({
        queryKey: QK.appointment(id),
        queryFn: () => getAppointmentById(id),
        staleTime: 5_000,
        enabled: !!id,
    });
}

export function useAppointmentsQuery(
    search = "",
    page = 1,
    limit = 20,
    startDate?: string,
    endDate?: string,
) {
    return useQuery({
        queryKey: QK.appointments(search, page, limit, startDate ?? null, endDate ?? null),
        queryFn: () => getAppointments({ page, limit, searchQuery: search || undefined, startDate, endDate }),
        staleTime: 5_000,
        placeholderData: keepPreviousData,
    });
}

export function useCreateAppointmentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (appt: AppointmentCreate) => createAppointment(appt),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["appointments"] });
            qc.invalidateQueries({ queryKey: ["calendar"] });
        },
    });
}

export function useUpdateAppointmentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, appt }: { id: string; appt: AppointmentCreate }) => updateAppointment(id, appt),
        onSuccess: (_data, variables) => {
            qc.removeQueries({ queryKey: QK.appointment(variables.id) });
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["appointments"] });
            qc.invalidateQueries({ queryKey: ["calendar"] });
        },
    });
}

export function useDeleteAppointmentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteAppointment(id),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["appointments"] });
            qc.invalidateQueries({ queryKey: ["calendar"] });
        },
    });
}

export function useUpdateAppointmentStatusMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointmentStatus(id, status),
        onSettled: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    });
}

export function useAppointmentOptionsQuery() {
    return useQuery({
        queryKey: ["appointment-options"],
        queryFn: getAppointmentOptions,
        staleTime: Infinity, // Options rarely change
    });
}

// ─── Treatments ────────────────────────────────────────

export function useTreatmentsQuery(page = 1, limit = 100) {
    return useQuery({
        queryKey: QK.treatments(page, limit),
        queryFn: () => getTreatments({ page, limit }),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useTreatmentByIdQuery(id: string | null | undefined) {
    return useQuery({
        queryKey: QK.treatment(id ?? ""),
        queryFn: () => getTreatmentById(id!),
        enabled: !!id,
        staleTime: 30_000,
    });
}

export function useTreatmentsByIdsQuery(ids: string[]) {
    return useQueries({
        queries: ids.map((id) => ({
            queryKey: QK.treatment(id),
            queryFn: () => getTreatmentById(id),
            staleTime: 30_000,
        })),
    });
}

export function useDocumentsByIdsQuery(ids: string[]) {
    return useQueries({
        queries: ids.map((id) => ({
            queryKey: QK.document(id),
            queryFn: () => getDocumentById(id),
            staleTime: 30_000,
        })),
    });
}

export function useBackpacksByIdsQuery(ids: string[]) {
    return useQueries({
        queries: ids.map((id) => ({
            queryKey: QK.backpack(id),
            queryFn: () => getBackpackById(id),
            staleTime: 30_000,
        })),
    });
}

// ─── Medications ───────────────────────────────────────

export function useMedicationsQuery(page = 1, limit = 20) {
    return useQuery({
        queryKey: QK.medications(page, limit),
        queryFn: () => getMedications({ page, limit }),
        staleTime: 5_000,
        placeholderData: keepPreviousData,
    });
}

export function useCreateMedicationMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => createMedication(name),
        onSettled: () => qc.invalidateQueries({ queryKey: ["medications"] }),
    });
}

export function useCreateMedicationCycleMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ medicationId, cycle }: { medicationId: string; cycle: MedicationCycleCreate }) =>
            createMedicationCycle(medicationId, cycle),
        onSettled: (_data, _err, variables) => {
            qc.invalidateQueries({ queryKey: ["medications"] });
            qc.invalidateQueries({ queryKey: ["medication", variables.medicationId] });
        },
    });
}

export function useUpdateMedicationMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => updateMedication(id, name),
        onSettled: () => qc.invalidateQueries({ queryKey: ["medications"] }),
    });
}

export function useDeleteMedicationMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMedication(id),
        onSettled: () => qc.invalidateQueries({ queryKey: ["medications"] }),
    });
}

export function useConfirmIntakeMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => confirmIntake(id),
        onSettled: () => qc.invalidateQueries({ queryKey: ["medications"] }),
    });
}
// ─── Doctors ───────────────────────────────────────────

export function useDoctorsQuery(search = "", page = 1, limit = 50) {
    return useQuery({
        queryKey: QK.doctors(search, page, limit),
        queryFn: () => getDoctors({ page, limit, searchQuery: search || undefined }),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useCreateDoctorMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (doctor: DoctorCreate) => createDoctor(doctor),
        onSettled: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
    });
}

export function useUpdateDoctorMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, doctor }: { id: string; doctor: DoctorCreate }) => updateDoctor(id, doctor),
        onSettled: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
    });
}

export function useDeleteDoctorMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDoctor(id),
        onSettled: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
    });
}

// ─── Notifications ─────────────────────────────────────

export function useNotificationsQuery(page = 1, limit = 20) {
    return useQuery({
        queryKey: QK.notifications(page),
        queryFn: () => getNotifications({ page, limit }),
        staleTime: 30_000,
        refetchInterval: 30_000,
    });
}

export function useMarkNotificationReadMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => markNotificationAsRead(id),
        onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    });
}

// ─── Calendar ──────────────────────────────────────────

export function useCalendarEventsQuery(startDate: string, endDate: string) {
    return useQuery({
        queryKey: QK.calendar(startDate, endDate),
        queryFn: () => getCalendarEvents(startDate, endDate),
        enabled: !!startDate && !!endDate,
        staleTime: 60_000,
    });
}

// ─── Profile ───────────────────────────────────────────

export function useProfileQuery() {
    return useQuery({
        queryKey: QK.profile(),
        queryFn: getMe,
        staleTime: 60_000,
    });
}

export function useUpdateProfileMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userData: UserUpdate) => updateMe(userData),
        onSettled: () => qc.invalidateQueries({ queryKey: QK.profile() }),
    });
}



// ─── Delegations ───────────────────────────────────────

export const delegationKeys = {
    all:      ()            => ["delegations"] as const,
    managed:  ()            => ["delegations", "managed"] as const,
    managers: ()            => ["delegations", "managers"] as const,
};

export function useManagedUsersQuery() {
    return useQuery({
        queryKey: delegationKeys.managed(),
        queryFn: getManagedUsers,
        staleTime: 30_000,
    });
}

export function useManagersQuery() {
    return useQuery({
        queryKey: delegationKeys.managers(),
        queryFn: getManagers,
        staleTime: 30_000,
    });
}

export function useCreateDelegationMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: DelegationRequest) => createDelegation(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: delegationKeys.all() }),
    });
}

export function useRespondDelegationMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
            respondDelegation(id, action),
        onSuccess: () => qc.invalidateQueries({ queryKey: delegationKeys.all() }),
    });
}

export function useRevokeDelegationMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => revokeDelegation(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: delegationKeys.all() }),
    });
}

export function useUpdateDelegationColorsMutation() {
    return useMutation({
        mutationFn: (colors: DelegationContextColors) => updateDelegationContextColors(colors),
    });
}

export * from "./reactQueryHooks";
export * from "./useDocumentFormCore";
export * from "./useProfileFormCore";
export * from "./useBackpackFormCore";
export * from "./useBackpackDetailCore";
export * from "./useMedicationFormCore";
export * from "./useMedicationCycleEditCore";
export * from "./useAppointmentFormCore";
export * from "./useNotificationsCore";
export * from "./useDashboardCore";
export * from "./useDoctorFormCore";
export * from "./backpackQueryUtils";
export * from "./useBackpackInfiniteDocuments";
export * from "./useDailyCheckInsInfinite";

