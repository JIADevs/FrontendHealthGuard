import type { Document } from "@helu/api";
import { getDocumentFilterLabel, inferDocumentCategoryKey, resolveDocFormat } from "@helu/ui";

export type DocumentDetailTag = {
  id: string;
  label: string;
  variant: "category" | "specialty" | "subtype" | "custom";
};

function normalizeCategoryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function isInstitutionCategory(name: string): boolean {
  const n = normalizeCategoryName(name);
  return n.includes("instituc") || n.includes("clinica") || n.includes("hospital");
}

function isDoctorCategory(name: string): boolean {
  const n = normalizeCategoryName(name);
  return n.includes("medico") || n.includes("doctor") || n.includes("profesional");
}

export function buildTagCategoryMap(
  categories: Array<{ id: string; name: string }> | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of categories ?? []) {
    map.set(cat.id, cat.name);
  }
  return map;
}

export function getDocumentSubtitle(
  document: Document,
  categoryMap: Map<string, string>,
): string | null {
  let institution: string | undefined;
  let doctor: string | undefined;

  for (const tag of document.customTags) {
    const categoryName = categoryMap.get(tag.categoryId) ?? "";
    if (isInstitutionCategory(categoryName)) {
      institution = tag.value;
    } else if (isDoctorCategory(categoryName)) {
      doctor = tag.value;
    }
  }

  if (!doctor && document.specialties[0]) {
    doctor = document.specialties[0].name;
  }

  const parts = [institution, doctor].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function getDocumentDetailTags(
  document: Document,
  categoryMap: Map<string, string>,
): DocumentDetailTag[] {
  const tags: DocumentDetailTag[] = [];
  const seen = new Set<string>();

  const push = (tag: DocumentDetailTag) => {
    const key = `${tag.variant}:${tag.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(tag);
  };

  const categoryKey = inferDocumentCategoryKey({
    documentTypeName: document.documentType?.name,
    specialtyNames: document.specialties.map((s) => s.name),
    subtypeNames: document.subtypes.map((s) => s.name),
    format: document.format,
  });

  push({
    id: `category-${categoryKey}`,
    label: getDocumentFilterLabel(categoryKey),
    variant: "category",
  });

  for (const specialty of document.specialties) {
    push({ id: specialty.id, label: specialty.name, variant: "specialty" });
  }

  for (const subtype of document.subtypes) {
    push({ id: subtype.id, label: subtype.name, variant: "subtype" });
  }

  for (const tag of document.customTags) {
    const categoryName = categoryMap.get(tag.categoryId) ?? "";
    if (isInstitutionCategory(categoryName)) {
      continue;
    }
    push({
      id: tag.id,
      label: tag.value,
      variant: isDoctorCategory(categoryName) ? "specialty" : "custom",
    });
  }

  return tags;
}

const PAGE_COUNT_TITLE_RE = /\((\d+)\s*p[aá]ginas?\)\s*$/i;

/** Páginas conocidas (p. ej. escaneo multipágina en el título). */
export function getDocumentPageCount(document: Document): number | null {
  const fromTitle = document.title.match(PAGE_COUNT_TITLE_RE);
  if (fromTitle) {
    const n = Number.parseInt(fromTitle[1]!, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  if (resolveDocFormat(document.format) === "image") return 1;
  return null;
}
