import { useEffect } from "react";
import { useAuthStore } from "@helu/stores";
import { useManagedUsersQuery } from "@helu/api/hooks";

/**
 * Clears patient impersonation when the active delegation is no longer ACTIVE
 * (e.g. caregiver revokes access while viewing the patient's profile).
 */
export function usePatientContextGuard() {
    const isManaging = useAuthStore((s) => s.isManaging);
    const activePatientId = useAuthStore((s) => s.activePatientId);
    const switchPatientContext = useAuthStore((s) => s.switchPatientContext);
    const managedQuery = useManagedUsersQuery();

    useEffect(() => {
        if (!isManaging || !activePatientId) return;
        if (!managedQuery.isFetched) return;

        const stillActive = (managedQuery.data ?? []).some(
            (d) =>
                d.status === "ACTIVE" &&
                (d.dependentUserId ?? d.id) === activePatientId,
        );

        if (!stillActive) {
            switchPatientContext(null);
        }
    }, [
        isManaging,
        activePatientId,
        managedQuery.data,
        managedQuery.isFetched,
        switchPatientContext,
    ]);
}
