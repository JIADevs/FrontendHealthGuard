/**
 * useBackpackDetailCore — lógica de detalle de mochila, agnóstica de plataforma.
 *
 * Cubre las operaciones que ocurren dentro de la vista de detalle:
 *   - Quitar un documento de la mochila
 *   - Compartir la mochila (genera link + QR)
 *
 * La plataforma inyecta `adapters` para notificaciones. El manejo de UI
 * específico (FAB, animaciones, modales) queda en cada pantalla.
 */

import { useState, useCallback } from "react";
import { useShareBackpackMutation, useRemoveDocFromBackpackMutation } from "./hooks";
import { isApiError } from "./errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackpackShareData {
  shareUrl: string;
  qrCodeUrl: string;
  expiresAt?: string;
}

export interface BackpackDetailState {
  /** Share data returned by the API after a successful share call. */
  shareData: BackpackShareData | null;
  /** True while the share mutation is in flight. */
  isSharing: boolean;
  /** ID of the document currently being removed (null when idle). */
  removingDocId: string | null;
}

export interface BackpackDetailActions {
  /**
   * Remove a document from the backpack.
   * @param documentId  The document UUID.
   * @param title       Human-readable title (used in success/error messages).
   */
  removeDocument: (documentId: string, title: string) => void;
  /** Generate a shareable link + QR for this backpack. */
  shareBackpack: () => void;
  /** Clear share data (e.g. when the user closes the share panel). */
  clearShareData: () => void;
}

export interface BackpackDetailAdapters {
  onRemoveSuccess: (title: string) => void;
  onRemoveError: (title: string, message: string) => void;
  onShareSuccess: (shareUrl: string) => void;
  onShareError: (title: string, message: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBackpackDetailCore(
  backpackId: string,
  adapters: BackpackDetailAdapters,
): BackpackDetailState & BackpackDetailActions {
  const [shareData, setShareData] = useState<BackpackShareData | null>(null);
  const [removingDocId, setRemovingDocId] = useState<string | null>(null);

  const shareMut = useShareBackpackMutation();
  const removeMut = useRemoveDocFromBackpackMutation();

  const removeDocument = useCallback(
    (documentId: string, title: string) => {
      setRemovingDocId(documentId);
      removeMut.mutate(
        { backpackId, documentId },
        {
          onSuccess: () => {
            adapters.onRemoveSuccess(title);
          },
          onError: (err) => {
            adapters.onRemoveError(
              "Error al quitar documento",
              isApiError(err) ? err.message : "No se pudo quitar el documento.",
            );
          },
          onSettled: () => {
            setRemovingDocId(null);
          },
        },
      );
    },
    [backpackId, removeMut, adapters],
  );

  const shareBackpack = useCallback(() => {
    shareMut.mutate(backpackId, {
      onSuccess: (data) => {
        const result = data as BackpackShareData;
        setShareData(result);
        adapters.onShareSuccess(result.shareUrl);
      },
      onError: (err) =>
        adapters.onShareError(
          "Error al compartir",
          isApiError(err) ? err.message : "No se pudo generar el link de compartición.",
        ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backpackId]);

  const clearShareData = useCallback(() => setShareData(null), []);

  return {
    shareData,
    isSharing: shareMut.isPending,
    removingDocId,

    removeDocument,
    shareBackpack,
    clearShareData,
  };
}
