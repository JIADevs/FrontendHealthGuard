/**
 * useBackpackFormCore — lógica de formulario de mochilas, agnóstica de plataforma.
 *
 * Cubre creación, edición y eliminación. La plataforma inyecta `adapters` para
 * notificaciones (toasts), diálogos de confirmación y navegación.
 *
 * Uso:
 *   Create: useBackpackFormCore({ adapters, backpackId: undefined })
 *   Edit:   useBackpackFormCore({ adapters, backpackId: "uuid" })
 */

import { useState, useEffect } from "react";
import {
  useBackpackQuery,
  useCreateBackpackMutation,
  useUpdateBackpackMutation,
  useDeleteBackpackMutation,
} from "./hooks";
import { isApiError } from "./errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackpackFormState {
  name: string;
  description: string;
  /** True while a save or delete request is in flight. */
  saving: boolean;
  deleting: boolean;
  /** True while the existing backpack is being fetched (edit mode). */
  loading: boolean;
  isEdit: boolean;
}

export interface BackpackFormActions {
  setName: (v: string) => void;
  setDescription: (v: string) => void;
  /**
   * Save the backpack (create or update).
   * The core validates the name and calls `adapters.onValidationError` if empty.
   */
  handleSave: () => void;
  /**
   * Delete the backpack. Should only be called after the platform has
   * shown a confirmation dialog, since this executes immediately.
   */
  handleDelete: () => void;
}

export interface BackpackFormAdapters {
  /** Called when name is empty before submitting. */
  onValidationError: (title: string, message: string) => void;
  /** Called after a successful create or update. */
  onSaveSuccess: (name: string, isEdit: boolean) => void;
  /** Called when the save API call fails. */
  onSaveError: (title: string, message: string) => void;
  /** Called after a successful delete. */
  onDeleteSuccess: (name: string) => void;
  /** Called when the delete API call fails. */
  onDeleteError: (title: string, message: string) => void;
  /** Navigation / UI action after a successful save (e.g. goBack or onClose). */
  afterSave: () => void;
  /** Navigation / UI action after a successful delete (e.g. goBack). */
  afterDelete: () => void;
}

export type UseBackpackFormCoreOptions = {
  adapters: BackpackFormAdapters;
  /** Pass undefined for create mode, a UUID for edit mode. */
  backpackId?: string;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBackpackFormCore({
  adapters,
  backpackId,
}: UseBackpackFormCoreOptions): BackpackFormState & BackpackFormActions {
  const isEdit = !!backpackId;

  const backpackQuery = useBackpackQuery(backpackId ?? "");
  const createMut = useCreateBackpackMutation();
  const updateMut = useUpdateBackpackMutation();
  const deleteMut = useDeleteBackpackMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Populate fields when the existing backpack loads (edit mode)
  useEffect(() => {
    if (!backpackQuery.data) return;
    setName(backpackQuery.data.name);
    setDescription(backpackQuery.data.description ?? "");
  }, [backpackQuery.data]);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      adapters.onValidationError(
        "Nombre requerido",
        "El nombre de la mochila no puede estar vacío.",
      );
      return;
    }

    const payload = {
      name: trimmedName,
      type: "CUSTOM" as const,
      description: description.trim() || undefined,
    };

    if (isEdit && backpackId) {
      updateMut.mutate(
        { id: backpackId, bp: payload },
        {
          onSuccess: () => {
            adapters.onSaveSuccess(trimmedName, true);
            adapters.afterSave();
          },
          onError: (err) =>
            adapters.onSaveError(
              "Error al guardar",
              isApiError(err) ? err.message : "No se pudo actualizar la mochila.",
            ),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          adapters.onSaveSuccess(trimmedName, false);
          adapters.afterSave();
        },
        onError: (err) =>
          adapters.onSaveError(
            "Error al crear",
            isApiError(err) ? err.message : "No se pudo crear la mochila.",
          ),
      });
    }
  }

  function handleDelete() {
    if (!backpackId) return;
    deleteMut.mutate(backpackId, {
      onSuccess: () => {
        adapters.onDeleteSuccess(name.trim());
        adapters.afterDelete();
      },
      onError: (err) =>
        adapters.onDeleteError(
          "Error al eliminar",
          isApiError(err) ? err.message : "No se pudo eliminar la mochila.",
        ),
    });
  }

  return {
    name,
    description,
    saving: createMut.isPending || updateMut.isPending,
    deleting: deleteMut.isPending,
    loading: isEdit && backpackQuery.isLoading,
    isEdit,

    setName,
    setDescription,
    handleSave,
    handleDelete,
  };
}
