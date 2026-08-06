
/**
 * Shared TanStack Query hooks — usable on both web (Next.js) and mobile (Expo).
 *
 * Pattern:
 *  - Query hooks  → handle cache keys, staleTime, placeholderData
 *  - Mutation hooks → handle cache invalidation in onSettled
 *    The caller adds platform-specific toast/navigation via mutate(data, { onSuccess, onError })
 */
export * from "./reactQueryHooks";
export * from "./useDocumentFormCore";
export * from "./useProfileFormCore";
export * from "./useBackpackFormCore";
export * from "./useBackpackDetailCore";
export * from "./useMedicationFormCore";
export * from "./useMedicationCycleEditCore";
export * from "./useTreatmentFormCore";
export * from "./useAppointmentFormCore";
export * from "./useNotificationsCore";
export * from "./useDashboardCore";
export * from "./useDoctorFormCore";
export * from "./backpackQueryUtils";
export * from "./useBackpackInfiniteDocuments";
export * from "./useDailyCheckInsInfinite";
