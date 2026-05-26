import type { DocumentCategoryKey } from "@helu/ui";
import { todayISODate } from "@helu/ui";

export type DocumentCategoryFilter = DocumentCategoryKey | null;

export type DocumentDatePreset =
  | null
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

/** Filtro de etiqueta aplicado: categoría + valor concreto. */
export interface DocumentTagFilter {
  categoryId: string;
  categoryName: string;
  valueId: string;
  valueLabel: string;
}

export interface DocumentListFilters {
  category: DocumentCategoryFilter;
  datePreset: DocumentDatePreset;
  startDate: string | null;
  endDate: string | null;
  tagFilters: DocumentTagFilter[];
}

export const EMPTY_DOCUMENT_FILTERS: DocumentListFilters = {
  category: null,
  datePreset: null,
  startDate: null,
  endDate: null,
  tagFilters: [],
};

export interface TagCategoryOption {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

export function addTagFilter(
  filters: DocumentTagFilter[],
  entry: DocumentTagFilter,
): DocumentTagFilter[] {
  if (filters.some((f) => f.valueId === entry.valueId)) return filters;
  return [...filters, entry];
}

export function removeTagFilter(filters: DocumentTagFilter[], valueId: string): DocumentTagFilter[] {
  return filters.filter((f) => f.valueId !== valueId);
}

/** AND entre categorías; OR entre valores de la misma categoría. */
export function documentMatchesTagFilters(
  docTagIds: string[],
  tagFilters: DocumentTagFilter[],
): boolean {
  if (tagFilters.length === 0) return true;

  const byCategory = new Map<string, string[]>();
  for (const f of tagFilters) {
    const ids = byCategory.get(f.categoryId) ?? [];
    ids.push(f.valueId);
    byCategory.set(f.categoryId, ids);
  }

  const docSet = new Set(docTagIds);
  for (const valueIds of byCategory.values()) {
    if (!valueIds.some((id) => docSet.has(id))) return false;
  }
  return true;
}

export const DOCUMENT_DATE_PRESETS: { id: DocumentDatePreset; label: string }[] = [
  { id: null, label: "Cualquier fecha" },
  { id: "week", label: "Últimos 7 días" },
  { id: "month", label: "Últimos 30 días" },
  { id: "quarter", label: "Últimos 3 meses" },
  { id: "year", label: "Este año" },
  { id: "custom", label: "Personalizado" },
];

function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Calcula rango ISO según preset (fin = hoy). */
export function resolveDateRangeFromPreset(
  preset: DocumentDatePreset,
  customStart?: string | null,
  customEnd?: string | null,
): { startDate: string | null; endDate: string | null } {
  if (!preset) return { startDate: null, endDate: null };

  if (preset === "custom") {
    return {
      startDate: customStart ?? null,
      endDate: customEnd ?? null,
    };
  }

  const end = new Date();
  const start = new Date();
  switch (preset) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(end.getMonth() - 3);
      break;
    case "year":
      start.setMonth(0, 1);
      break;
    default:
      break;
  }

  return { startDate: toISODate(start), endDate: toISODate(end) };
}

export function hasActiveDocumentFilters(filters: DocumentListFilters): boolean {
  return (
    filters.category !== null ||
    filters.datePreset !== null ||
    filters.tagFilters.length > 0
  );
}

/** Fechas efectivas enviadas al API. */
export function getEffectiveDateRange(filters: DocumentListFilters): {
  startDate?: string;
  endDate?: string;
} {
  const { startDate, endDate } = resolveDateRangeFromPreset(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );
  return {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate: endDate ?? todayISODate() } : {}),
  };
}
