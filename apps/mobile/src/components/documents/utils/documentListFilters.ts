import type { Document } from "@helu/api";
import { categoryOf, type DocumentCategory } from "../documentCategories";

/**
 * Filters of the Documentos list (mockup «Filtros»): categories, tag values and a «Desde» /
 * «Hasta» range. Category and tags filter on the client; dates go to the API.
 */
export interface DocumentListFilters {
  categories: DocumentCategory[];
  /** Selected tag value ids. AND across tag categories, OR inside one (see `documentMatchesTags`). */
  tagValueIds: string[];
  /** YYYY-MM-DD, inclusive. */
  startDate: string | null;
  endDate: string | null;
}

export const EMPTY_DOCUMENT_FILTERS: DocumentListFilters = {
  categories: [],
  tagValueIds: [],
  startDate: null,
  endDate: null,
};

export interface TagCategoryOption {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

export function hasActiveDocumentFilters(filters: DocumentListFilters): boolean {
  return (
    filters.categories.length > 0 || filters.tagValueIds.length > 0 || filters.startDate !== null || filters.endDate !== null
  );
}

export function sameDateRange(a: DocumentListFilters, b: DocumentListFilters): boolean {
  return a.startDate === b.startDate && a.endDate === b.endDate;
}

/** AND across tag categories, OR between values of the same category. */
export function documentMatchesTags(doc: Document, tagValueIds: string[], valueToCategory: Map<string, string>): boolean {
  if (tagValueIds.length === 0) return true;
  const byCategory = new Map<string, string[]>();
  for (const id of tagValueIds) {
    const cat = valueToCategory.get(id) ?? id;
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), id]);
  }
  const docTags = new Set(doc.customTags.map((t) => t.id));
  for (const ids of byCategory.values()) {
    if (!ids.some((id) => docTags.has(id))) return false;
  }
  return true;
}

/** Category and tag filters (the date range is already applied by the API). */
export function applyClientFilters(
  docs: Document[],
  filters: DocumentListFilters,
  valueToCategory: Map<string, string>,
): Document[] {
  return docs.filter(
    (doc) =>
      (filters.categories.length === 0 || filters.categories.includes(categoryOf(doc))) &&
      documentMatchesTags(doc, filters.tagValueIds, valueToCategory),
  );
}
