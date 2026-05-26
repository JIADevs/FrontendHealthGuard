import { useCallback, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { deleteDocument, isApiError, type Document } from "@helu/api";

const UNDO_DELAY_MS = 5000;

type DocumentListPage = {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function removeDocFromPage(page: DocumentListPage, id: string): DocumentListPage {
  const items = page.items.filter((d) => d.id !== id);
  return {
    ...page,
    items,
    total: Math.max(0, page.total - (page.items.length - items.length)),
  };
}

interface UseDocumentDeleteWithUndoOptions {
  /** Called right after the user confirms (e.g. navigate back from detail). */
  onDeleted?: () => void;
}

export function useDocumentDeleteWithUndo(options?: UseDocumentDeleteWithUndoOptions) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const pendingUndoRef = useRef<{ timer: ReturnType<typeof setTimeout>; docId: string } | null>(null);
  const onDeletedRef = useRef(options?.onDeleted);
  onDeletedRef.current = options?.onDeleted;

  const requestDelete = useCallback((doc: Document) => {
    setDeleteTarget(doc);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const doc = deleteTarget;

    const snapshot = queryClient.getQueriesData<DocumentListPage>({ queryKey: ["documents"] });
    snapshot.forEach(([key, data]) => {
      if (!data) return;
      queryClient.setQueryData(key, removeDocFromPage(data, doc.id));
    });

    queryClient.removeQueries({ queryKey: ["document", doc.id] });

    setDeleteTarget(null);
    onDeletedRef.current?.();

    const finalize = () => {
      pendingUndoRef.current = null;
      deleteDocument(doc.id).catch((err) => {
        snapshot.forEach(([key, data]) => {
          if (data) queryClient.setQueryData(key, data);
        });
        Toast.show({
          type: "error",
          text1: "Error al eliminar",
          text2: isApiError(err) ? err.message : "No se pudo eliminar el documento.",
        });
      });
    };

    const onUndo = () => {
      if (pendingUndoRef.current?.docId !== doc.id) return;
      clearTimeout(pendingUndoRef.current.timer);
      pendingUndoRef.current = null;
      snapshot.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data);
      });
      void queryClient.invalidateQueries({ queryKey: ["document", doc.id] });
      Toast.hide();
    };

    if (pendingUndoRef.current) {
      clearTimeout(pendingUndoRef.current.timer);
    }
    const timer = setTimeout(finalize, UNDO_DELAY_MS);
    pendingUndoRef.current = { timer, docId: doc.id };

    Toast.show({
      type: "success",
      text1: "Documento eliminado",
      visibilityTime: UNDO_DELAY_MS,
      props: {
        actionLabel: "Deshacer",
        onAction: onUndo,
      },
    });
  }, [deleteTarget, queryClient]);

  return {
    deleteTarget,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deletePending: false,
  };
}
