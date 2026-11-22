import { useCallback } from "react";
import Toast from "react-native-toast-message";
import { useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { deleteDocument, isApiError, type Document } from "@helu/api";
import { notify } from "../lib/notify";

const UNDO_DELAY_MS = 5000;

type DocumentListPage = { items: Document[]; total: number; page: number; limit: number; totalPages: number };
type Snapshot = [QueryKey, DocumentListPage | undefined][];

/**
 * Deletes waiting for their «Deshacer» window, one timer per document. Module-level so a delete
 * started in the detail keeps running after that screen closes, and a second delete within 5 s
 * no longer cancels the first one (#43).
 */
const pending = new Map<string, { timer: ReturnType<typeof setTimeout>; snapshot: Snapshot }>();

function removeDocFromPage(page: DocumentListPage, id: string): DocumentListPage {
  const items = page.items.filter((d) => d.id !== id);
  return { ...page, items, total: Math.max(0, page.total - (page.items.length - items.length)) };
}

function restore(queryClient: QueryClient, id: string, snapshot: Snapshot) {
  // Put the document back into every list it was in, keeping deletes of other documents applied.
  snapshot.forEach(([key, before]) => {
    const doc = before?.items.find((d) => d.id === id);
    if (!before || !doc) return;
    queryClient.setQueryData<DocumentListPage>(key, (now) => {
      if (!now || now.items.some((d) => d.id === id)) return now;
      const index = before.items.findIndex((d) => d.id === id);
      const items = [...now.items];
      items.splice(Math.min(index, items.length), 0, doc);
      return { ...now, items, total: now.total + 1 };
    });
  });
}

/**
 * «Eliminar» without a modal (mockup «Documento eliminado · deshacer»): the document leaves the lists
 * at once, the toast offers «Deshacer» for 5 s, and only then the `DELETE` goes to the API.
 */
export function useDocumentDeleteWithUndo() {
  const queryClient = useQueryClient();

  return useCallback(
    (doc: Document, options?: { onDeleted?: () => void }) => {
      const snapshot = queryClient.getQueriesData<DocumentListPage>({ queryKey: ["documents"] });
      snapshot.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, removeDocFromPage(data, doc.id));
      });
      options?.onDeleted?.();

      const finalize = () => {
        pending.delete(doc.id);
        queryClient.removeQueries({ queryKey: ["document", doc.id] });
        deleteDocument(doc.id)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ["backpack-docs"], exact: false });
            void queryClient.invalidateQueries({ queryKey: ["backpack-doc-ids"], exact: false });
          })
          .catch((err) => {
            restore(queryClient, doc.id, snapshot);
            notify({
              tone: "error",
              message: "No se pudo eliminar",
              description: isApiError(err) ? "Intenta de nuevo en un momento." : "Revisa tu conexión e intenta de nuevo.",
            });
          });
      };

      const undo = () => {
        const entry = pending.get(doc.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        pending.delete(doc.id);
        restore(queryClient, doc.id, entry.snapshot);
        Toast.hide();
      };

      pending.set(doc.id, { timer: setTimeout(finalize, UNDO_DELAY_MS), snapshot });
      notify({ tone: "info", message: "Documento eliminado", action: { label: "Deshacer", onPress: undo } });
    },
    [queryClient],
  );
}
