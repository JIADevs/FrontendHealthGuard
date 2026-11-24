import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backpackQueryKeys, invalidateBackpackQueries, useBackpackQuery } from "@helu/api/hooks";
import { addDocToBackpack, getBackpackDocuments, isApiError, type DocumentPage } from "@helu/api";
import { notify } from "../../lib/notify";
import { documentCountLabel } from "./backpackCopy";
import { DocumentPicker } from "../documents/DocumentPicker";

export interface BackpackAddDocumentsProps {
  id: string;
  onClose: () => void;
  /** «Subir documento» / «Escanear» from the empty state; the picker comes back with it selected. */
  onUpload: () => void;
  onScan: () => void;
}

/** Every document already in the backpack, to show «Ya en la mochila» (all pages). */
function useBackpackDocIds(id: string) {
  return useQuery({
    queryKey: backpackQueryKeys.backpackDocIds(id),
    queryFn: async () => {
      const ids = new Set<string>();
      let page = 1;
      let totalPages = 1;
      do {
        const res: DocumentPage = await getBackpackDocuments({ backpackId: id, page, limit: 100 });
        res.items.forEach((doc) => ids.add(doc.id));
        totalPages = res.totalPages;
        page += 1;
      } while (page <= totalPages);
      return ids;
    },
    enabled: !!id,
    staleTime: 5_000,
  });
}

/**
 * Mockup «Agregar documentos» (m5) for a backpack: the shared `DocumentPicker` with «Ya en la mochila»
 * for the documents already in it.
 */
export function BackpackAddDocuments({ id, onClose, onUpload, onScan }: BackpackAddDocumentsProps) {
  const qc = useQueryClient();
  const backpack = useBackpackQuery(id).data;
  const existing = useBackpackDocIds(id);

  const add = async (selected: string[]): Promise<void> => {
    let failed = 0;
    for (const documentId of selected) {
      try {
        await addDocToBackpack(id, documentId);
      } catch (err) {
        // Already there (409) counts as added.
        if (!(isApiError(err) && err.isConflict)) failed += 1;
      }
    }
    // Close only once the backpack has the new rows, so the detail never shows the old content.
    await Promise.all([
      qc.refetchQueries({ queryKey: ["backpack-docs-infinite", id] }),
      qc.refetchQueries({ queryKey: ["backpack", id] }),
    ]).catch(() => undefined);
    invalidateBackpackQueries(qc, id);
    if (failed === selected.length) {
      notify({
        tone: "error",
        message: "No se pudieron agregar",
        description: "Revisa tu conexión e intenta de nuevo.",
        action: { label: "Reintentar", onPress: () => void add(selected) },
      });
      return;
    }
    const added = selected.length - failed;
    notify({
      tone: failed > 0 ? "warning" : "success",
      message: added === 1 ? "Documento agregado" : `${documentCountLabel(added)} agregados`,
      description: failed > 0 ? `${failed} no se pudieron agregar. Intenta de nuevo.` : backpack?.name,
    });
    onClose();
  };

  return (
    <DocumentPicker
      subtitle={backpack?.name}
      existingIds={existing.data}
      loadingExisting={existing.isLoading}
      lockedLabel="Ya en la mochila"
      onAdd={add}
      onUpload={onUpload}
      onScan={onScan}
    />
  );
}
