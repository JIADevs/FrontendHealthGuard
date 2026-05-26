import type { TagCategoryOut } from "@helu/api";

export type TagValueRef = {
  id: string;
  value: string;
  categoryId: string;
  categoryName: string;
};

export type TagCategoryGroup = {
  categoryId: string;
  categoryName: string;
  tags: TagValueRef[];
};

export function flattenTagValues(categories: TagCategoryOut[]): TagValueRef[] {
  return categories.flatMap((category) =>
    (category.values ?? []).map((val) => ({
      id: val.id,
      value: val.value,
      categoryId: category.id,
      categoryName: category.name,
    })),
  );
}

/** Agrupa etiquetas por categoría, respetando el orden del catálogo. */
export function groupTagsByCategory(
  tags: TagValueRef[],
  categories: TagCategoryOut[],
): TagCategoryGroup[] {
  const byCategory = new Map<string, TagValueRef[]>();

  for (const tag of tags) {
    const list = byCategory.get(tag.categoryId) ?? [];
    list.push(tag);
    byCategory.set(tag.categoryId, list);
  }

  const ordered: TagCategoryGroup[] = [];

  for (const category of categories) {
    const list = byCategory.get(category.id);
    if (!list?.length) continue;
    ordered.push({
      categoryId: category.id,
      categoryName: category.name,
      tags: list.sort((a, b) => a.value.localeCompare(b.value, "es")),
    });
    byCategory.delete(category.id);
  }

  for (const [, list] of byCategory) {
    const first = list[0]!;
    ordered.push({
      categoryId: first.categoryId,
      categoryName: first.categoryName,
      tags: list.sort((a, b) => a.value.localeCompare(b.value, "es")),
    });
  }

  return ordered;
}

export function pickDefaultCategoryId(categories: TagCategoryOut[]): string | undefined {
  const preferred = categories.find((c) =>
    /general|etiqueta|tag/i.test(c.name),
  );
  return preferred?.id ?? categories[0]?.id;
}

/** Minúsculas sin tildes ni diacríticos para búsqueda tolerante. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function textMatchesSearch(query: string, ...parts: string[]): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return parts.some((part) => normalizeSearchText(part).includes(q));
}

export function textEqualsSearch(a: string, b: string): boolean {
  return normalizeSearchText(a) === normalizeSearchText(b);
}

export function tagMatchesQuery(tag: TagValueRef, query: string): boolean {
  return textMatchesSearch(query, tag.value, tag.categoryName);
}

export function tagDisplayName(tag: TagValueRef): string {
  if (tag.categoryName.trim().toLowerCase() === tag.value.trim().toLowerCase()) {
    return tag.value;
  }
  return `${tag.categoryName}: ${tag.value}`;
}
