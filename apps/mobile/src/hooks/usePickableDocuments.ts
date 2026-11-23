import { useMemo, useState } from "react";
import { useDocumentsQuery } from "@helu/api/hooks";
import { useDebounceSearch } from "@helu/ui";
import type { Document } from "@helu/api";
import { categoryOf, type DocumentCategory } from "../components/documents/documentCategories";

/** Same page as the Documentos tab without filters, so it is usually already cached. */
const LIST_FETCH_LIMIT = 100;

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matches(doc: Document, query: string): boolean {
  const haystack = fold([doc.title, doc.description ?? "", ...doc.customTags.map((tag) => tag.value)].join(" "));
  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * Documents to pick for a backpack (Nueva mochila, Agregar documentos) and, next, for Compartir:
 * search and category run on the client over the loaded list, so typing never waits on the server.
 */
export function usePickableDocuments() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const debouncedSearch = useDebounceSearch(search);
  const query = useDocumentsQuery("", 1, LIST_FETCH_LIMIT, null, null);
  const all = useMemo(() => (query.data?.items ?? []) as Document[], [query.data]);

  const items = useMemo(() => {
    const q = debouncedSearch.trim();
    return all.filter((doc) => (category === "all" || categoryOf(doc) === category) && (!q || matches(doc, q)));
  }, [all, debouncedSearch, category]);

  return {
    search,
    setSearch,
    debouncedSearch,
    category,
    setCategory,
    items,
    /** Every loaded document, to tell «no documents at all» from «nothing matches». */
    total: all.length,
    isLoading: query.isLoading,
    isError: query.isError && !query.data,
    refetch: query.refetch,
  };
}
