import { useCallback } from "react";
import { Linking } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { getSignedUrl, type Document } from "@helu/api";
import { resolveDocFormat } from "@helu/ui";
import { notify } from "../lib/notify";
import { useOpenDocumentExternal } from "./useOpenDocumentExternal";

/**
 * «Descargar» from a list row (the «Más» sheet, #127): the detail already has the signed URL, a row
 * fetches it on tap (same cache key as the detail). A portal link opens the portal instead.
 */
export function useDownloadDocument() {
  const qc = useQueryClient();
  const { openDocument, opening } = useOpenDocumentExternal();

  const download = useCallback(
    async (doc: Document) => {
      if (doc.kind === "LINK") {
        void Linking.openURL(doc.portalUrl ?? "");
        return;
      }
      if (!doc.fileUrl) return;
      try {
        const signed = await qc.fetchQuery({ queryKey: ["signed-url", doc.fileUrl], queryFn: () => getSignedUrl(doc.fileUrl!) });
        await openDocument({ url: signed?.url ?? "", title: doc.title, format: doc.format ?? "", docFormat: resolveDocFormat(doc.format ?? "") });
      } catch {
        notify({ tone: "error", message: "No se pudo descargar el documento", description: "Revisa tu conexión e intenta de nuevo." });
      }
    },
    [openDocument, qc],
  );

  return { download, downloading: opening };
}
