import type { Document } from "@helu/api";
import { resolveDocumentCategoryTheme, type DocumentCategoryTheme } from "@helu/ui";

export function resolveDocumentTheme(document: Document): DocumentCategoryTheme {
  return resolveDocumentCategoryTheme({
    documentTypeName: document.documentType?.name,
    specialtyNames: document.specialties.map((s) => s.name),
    subtypeNames: document.subtypes.map((s) => s.name),
    format: document.format,
  });
}
