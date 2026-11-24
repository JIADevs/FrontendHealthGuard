import { useState } from "react";
import {
    useCreateTreatmentMutation,
    useUpdateTreatmentMutation,
} from "./reactQueryHooks";
import { isApiError } from "./errors";
import type { Treatment } from "./schemas";

export type TreatmentStatus = "ACTIVE" | "COMPLETED" | "INACTIVE";

export interface TreatmentFormState {
    name: string;
    description: string;
    status: TreatmentStatus;
    startDate: string;
    endDate: string;
    error: string | null;
    saving: boolean;
    isEdit: boolean;
}

export interface TreatmentFormActions {
    setName: (v: string) => void;
    setDescription: (v: string) => void;
    setStatus: (v: TreatmentStatus) => void;
    setStartDate: (v: string) => void;
    setEndDate: (v: string) => void;
    clearError: () => void;
    handleSave: () => void;
}

export interface TreatmentFormAdapters {
    /**
     * Called on successful create or update (e.g. show toast). Receives the saved treatment id
     * so the list can highlight it or the app can open its detail (movimiento-interacciones.md §6
     * «Acción guardada»).
     */
    onSaveSuccess: (savedId?: string) => void;
    afterSave: () => void;
    /**
     * Optional: called with the raw error when create or update fails (`error` is still set). Lets the
     * app put a 422's `fieldErrors` under each field and tell a network error from a rejected one.
     */
    onSaveError?: (error: unknown) => void;
}

export function useTreatmentFormCore({
    initial,
    defaultStartDate,
    adapters,
}: {
    initial?: Treatment | null;
    /** «Inicio» for a new treatment, e.g. today's local date (`YYYY-MM-DD`). Ignored when editing. */
    defaultStartDate?: string;
    adapters: TreatmentFormAdapters;
}): TreatmentFormState & TreatmentFormActions {
    const isEdit = !!initial;

    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [status, setStatus] = useState<TreatmentStatus>(initial?.status ?? "ACTIVE");
    const [startDate, setStartDate] = useState(initial ? (initial.startDate ?? "") : (defaultStartDate ?? ""));
    const [endDate, setEndDate] = useState(initial?.endDate ?? "");
    const [error, setError] = useState<string | null>(null);

    const createMut = useCreateTreatmentMutation();
    const updateMut = useUpdateTreatmentMutation();
    const saving = createMut.isPending || updateMut.isPending;

    function handleSave() {
        if (!name.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        if (startDate && endDate && endDate < startDate) {
            setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
            return;
        }

        setError(null);
        // An emptied optional field must reach the PATCH as null: JSON drops undefined and the
        // backend only updates the fields it receives, so the old value would stay.
        const empty = isEdit ? null : undefined;
        const payload = {
            name: name.trim(),
            description: description.trim() || empty,
            status,
            startDate: startDate || empty,
            endDate: endDate || empty,
        };

        if (isEdit && initial) {
            updateMut.mutate(
                { id: initial.id, treatment: payload },
                {
                    onSuccess: () => {
                        adapters.onSaveSuccess(initial.id);
                        adapters.afterSave();
                    },
                    onError: (err) => {
                        setError(isApiError(err) ? err.message : "Error actualizando el tratamiento.");
                        adapters.onSaveError?.(err);
                    },
                },
            );
            return;
        }

        createMut.mutate(payload, {
            onSuccess: (created) => {
                adapters.onSaveSuccess(created.id);
                adapters.afterSave();
            },
            onError: (err) => {
                setError(isApiError(err) ? err.message : "Error guardando el tratamiento.");
                adapters.onSaveError?.(err);
            },
        });
    }

    return {
        name,
        description,
        status,
        startDate,
        endDate,
        error,
        saving,
        isEdit,
        setName,
        setDescription,
        setStatus,
        setStartDate,
        setEndDate,
        clearError: () => setError(null),
        handleSave,
    };
}
