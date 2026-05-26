import type { Document } from "@helu/api";

export function sumDocumentsBytes(documents: Document[]): number {
  return documents.reduce((acc, doc) => acc + (doc.fileSizeBytes ?? 0), 0);
}
