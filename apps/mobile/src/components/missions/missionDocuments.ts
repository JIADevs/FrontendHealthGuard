import { useMemo } from "react";
import { useDocumentsByIdsQuery } from "@helu/api/hooks";
import type { Document, Mission } from "@helu/api";

export type MissionDocumentView = Pick<Document, "id" | "title" | "kind" | "documentType" | "documentDate" | "uploadedAt"> & {
  stepKey: string | null;
};

/**
 * The mission's documents with their Documentos data (category, date). Until a document loads, the
 * mission's own copy (title, upload date) stands in, so the card never waits on every document.
 */
export function useMissionDocuments(mission: Mission | undefined) {
  const linked = mission?.documents ?? [];
  const queries = useDocumentsByIdsQuery(linked.map((d) => d.id));
  const fetched = queries.map((q) => q.data);
  const key = fetched.map((d) => d?.id ?? "").join(",");
  return useMemo<MissionDocumentView[]>(
    () =>
      linked.map((d) => {
        const full = fetched.find((f) => f?.id === d.id);
        return {
          id: d.id,
          title: full?.title ?? d.title,
          kind: (full?.kind ?? d.kind ?? "FILE") as Document["kind"],
          documentType: full?.documentType ?? null,
          documentDate: full?.documentDate ?? null,
          uploadedAt: full?.uploadedAt ?? d.uploadedAt ?? d.addedAt ?? new Date().toISOString(),
          stepKey: d.stepKey ?? null,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mission?.documents, key],
  );
}
