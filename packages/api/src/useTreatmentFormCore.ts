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
    onSaveSuccess: () => void;
    afterSave: () => void;
}

export function useTreatmentFormCore({
    initial,
    adapters,
}: {
    initial?: Treatment | null;
    adapters: TreatmentFormAdapters;
}): TreatmentFormState & TreatmentFormActions {
    const isEdit = !!initial;

    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [status, setStatus] = useState<TreatmentStatus>(initial?.status ?? "ACTIVE");
    const [startDate, setStartDate] = useState(initial?.startDate ?? "");
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
        const payload = {
            name: name.trim(),
            description: description.trim() || undefined,
            status,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        };

        if (isEdit && initial) {
            updateMut.mutate(
                { id: initial.id, treatment: payload },
                {
                    onSuccess: () => {
                        adapters.onSaveSuccess();
                        adapters.afterSave();
                    },
                    onError: (err) => {
                        setError(isApiError(err) ? err.message : "Error actualizando el tratamiento.");
                    },
                },
            );
            return;
        }

        createMut.mutate(payload, {
            onSuccess: () => {
                adapters.onSaveSuccess();
                adapters.afterSave();
            },
            onError: (err) => {
                setError(isApiError(err) ? err.message : "Error guardando el tratamiento.");
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
