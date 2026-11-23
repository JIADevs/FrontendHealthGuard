import { useCallback } from "react";
import Toast from "react-native-toast-message";
import { useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { deleteBackpack, isApiError, removeDocFromBackpack, type Backpack, type Document } from "@helu/api";
import { invalidateBackpackQueries } from "@helu/api/hooks";
import { notify } from "../lib/notify";

/**
 * «Deshacer» for backpacks (#46, decision 4), the same way as deleting a document in phase 9: the
 * change shows at once, the toast offers «Deshacer» for 5 s, and only then the request goes out.
 * Timers live at module level so they keep running after the screen that started them closes.
 */
const UNDO_DELAY_MS = 5000;

type Page<T> = { items: T[]; total: number; page: number; limit: number; totalPages: number };
type DocPages = InfiniteData<Page<Document>>;

const pendingRemovals = new Map<string, ReturnType<typeof setTimeout>>();
const pendingDeletes = new Map<string, ReturnType<typeof setTimeout>>();

/** Adds `delta` to a backpack's document count wherever it is cached (detail and lists). */
function bumpCount(qc: QueryClient, backpackId: string, delta: number) {
  qc.setQueryData<Backpack>(["backpack", backpackId], (bp) =>
    bp ? { ...bp, documentCount: Math.max(0, (bp.documentCount ?? 0) + delta) } : bp,
  );
  qc.setQueriesData<Page<Backpack>>({ queryKey: ["backpacks"] }, (page) =>
    page
      ? {
          ...page,
          items: page.items.map((bp) =>
            bp.id === backpackId ? { ...bp, documentCount: Math.max(0, (bp.documentCount ?? 0) + delta) } : bp,
          ),
        }
      : page,
  );
}

/** Removes a document from a backpack with «Deshacer». */
export function useBackpackDocRemoveWithUndo(backpackId: string) {
  const qc = useQueryClient();

  return useCallback(
    (doc: Document) => {
      const key = `${backpackId}:${doc.id}`;
      if (pendingRemovals.has(key)) return;

      // Where the row was, so «Deshacer» puts it back in the same place.
      const snapshot = qc.getQueriesData<DocPages>({ queryKey: ["backpack-docs-infinite", backpackId] });
      const positions = snapshot.map(([queryKey, data]) => {
        let at: { page: number; index: number } | null = null;
        data?.pages.forEach((p, page) => {
          const index = p.items.findIndex((d) => d.id === doc.id);
          if (index >= 0 && !at) at = { page, index };
        });
        return { queryKey, at };
      });

      qc.setQueriesData<DocPages>({ queryKey: ["backpack-docs-infinite", backpackId] }, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((p) => {
                const items = p.items.filter((d) => d.id !== doc.id);
                return { ...p, items, total: Math.max(0, p.total - (p.items.length - items.length)) };
              }),
            }
          : data,
      );
      qc.setQueryData<Set<string>>(["backpack-doc-ids", backpackId], (ids) => {
        if (!ids) return ids;
        const next = new Set(ids);
        next.delete(doc.id);
        return next;
      });
      bumpCount(qc, backpackId, -1);

      const restore = () => {
        positions.forEach(({ queryKey, at }) => {
          if (!at) return;
          const { page, index } = at;
          qc.setQueryData<DocPages>(queryKey, (data) => {
            if (!data || data.pages.some((p) => p.items.some((d) => d.id === doc.id))) return data;
            return {
              ...data,
              pages: data.pages.map((p, i) => {
                if (i !== page) return { ...p, total: p.total + 1 };
                const items = [...p.items];
                items.splice(Math.min(index, items.length), 0, doc);
                return { ...p, items, total: p.total + 1 };
              }),
            };
          });
        });
        qc.setQueryData<Set<string>>(["backpack-doc-ids", backpackId], (ids) => (ids ? new Set(ids).add(doc.id) : ids));
        bumpCount(qc, backpackId, 1);
      };

      const finalize = () => {
        pendingRemovals.delete(key);
        removeDocFromBackpack(backpackId, doc.id)
          .then(() => invalidateBackpackQueries(qc, backpackId))
          .catch((err) => {
            restore();
            notify({
              tone: "error",
              message: "No se pudo quitar el documento",
              description: isApiError(err) ? "Intenta de nuevo en un momento." : "Revisa tu conexión e intenta de nuevo.",
            });
          });
      };

      const undo = () => {
        const timer = pendingRemovals.get(key);
        if (!timer) return;
        clearTimeout(timer);
        pendingRemovals.delete(key);
        restore();
        Toast.hide();
      };

      pendingRemovals.set(key, setTimeout(finalize, UNDO_DELAY_MS));
      notify({
        tone: "info",
        message: "Documento quitado de la mochila",
        description: "Sigue en tus documentos.",
        action: { label: "Deshacer", onPress: undo },
      });
    },
    [qc, backpackId],
  );
}

/** Deletes a backpack with «Deshacer». The caller asks for confirmation first (#46, decision 4). */
export function useBackpackDeleteWithUndo() {
  const qc = useQueryClient();

  return useCallback(
    (backpack: Backpack) => {
      if (pendingDeletes.has(backpack.id)) return;
      const snapshot = qc.getQueriesData<Page<Backpack>>({ queryKey: ["backpacks"] });
      qc.setQueriesData<Page<Backpack>>({ queryKey: ["backpacks"] }, (page) => {
        if (!page) return page;
        const items = page.items.filter((bp) => bp.id !== backpack.id);
        return { ...page, items, total: Math.max(0, page.total - (page.items.length - items.length)) };
      });

      const restore = () => {
        snapshot.forEach(([queryKey, before]) => {
          const index = before?.items.findIndex((bp) => bp.id === backpack.id) ?? -1;
          if (index < 0) return;
          qc.setQueryData<Page<Backpack>>(queryKey, (now) => {
            if (!now || now.items.some((bp) => bp.id === backpack.id)) return now;
            const items = [...now.items];
            items.splice(Math.min(index, items.length), 0, backpack);
            return { ...now, items, total: now.total + 1 };
          });
        });
      };

      const finalize = () => {
        pendingDeletes.delete(backpack.id);
        deleteBackpack(backpack.id)
          .then(() => {
            qc.removeQueries({ queryKey: ["backpack", backpack.id] });
            void qc.invalidateQueries({ queryKey: ["backpacks"] });
          })
          .catch((err) => {
            restore();
            notify({
              tone: "error",
              message: "No se pudo eliminar la mochila",
              description: isApiError(err) ? "Intenta de nuevo en un momento." : "Revisa tu conexión e intenta de nuevo.",
            });
          });
      };

      const undo = () => {
        const timer = pendingDeletes.get(backpack.id);
        if (!timer) return;
        clearTimeout(timer);
        pendingDeletes.delete(backpack.id);
        restore();
        Toast.hide();
      };

      pendingDeletes.set(backpack.id, setTimeout(finalize, UNDO_DELAY_MS));
      notify({
        tone: "info",
        message: "Mochila eliminada",
        description: "Tus documentos siguen en Documentos.",
        action: { label: "Deshacer", onPress: undo },
      });
    },
    [qc],
  );
}

/** A refetch inside the 5 s window must not bring back what the user just removed. */
export function isBackpackPendingDelete(id: string): boolean {
  return pendingDeletes.has(id);
}

export function isDocPendingRemoval(backpackId: string, documentId: string): boolean {
  return pendingRemovals.has(`${backpackId}:${documentId}`);
}
