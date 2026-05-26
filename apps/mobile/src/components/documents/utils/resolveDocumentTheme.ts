import type { Document } from "@helu/api";
import {
  resolveDocumentCategoryTheme,
  type DocumentCategoryKey,
  type DocumentCategoryTheme,
  type ThemeContextValue,
} from "@helu/ui";

function adaptCategoryThemeForDark(
  category: DocumentCategoryTheme,
  t: ThemeContextValue,
): DocumentCategoryTheme {
  const tokensByKey: Record<
    DocumentCategoryKey,
    Pick<DocumentCategoryTheme, "bg" | "iconColor" | "tagBg" | "tagText">
  > = {
    laboratory: {
      bg: t.accent.docBg,
      iconColor: t.accent.docFg,
      tagBg: t.accent.docBg,
      tagText: t.accent.docFg,
    },
    cardiology: {
      bg: t.accent.calBg,
      iconColor: t.accent.calFg,
      tagBg: t.accent.calBg,
      tagText: t.accent.calFg,
    },
    imaging: {
      bg: t.brand.tint,
      iconColor: t.brand.fg,
      tagBg: t.brand.tint,
      tagText: t.brand.tintText,
    },
    formula: {
      bg: t.accent.medBg,
      iconColor: t.accent.medFg,
      tagBg: t.accent.medBg,
      tagText: t.accent.medFg,
    },
    history: {
      bg: t.brand.tintMed,
      iconColor: t.brand.tintText,
      tagBg: t.brand.tint,
      tagText: t.brand.tintText,
    },
    vaccine: {
      bg: t.accent.docBg,
      iconColor: t.accent.docFg,
      tagBg: t.accent.docBg,
      tagText: t.accent.docFg,
    },
    default: {
      bg: t.border.light,
      iconColor: t.text.secondary,
      tagBg: t.border.light,
      tagText: t.text.secondary,
    },
  };

  return { ...category, ...tokensByKey[category.key] };
}

export function resolveDocumentTheme(
  document: Document,
  appTheme?: ThemeContextValue,
): DocumentCategoryTheme {
  const base = resolveDocumentCategoryTheme({
    documentTypeName: document.documentType?.name,
    specialtyNames: document.specialties.map((s) => s.name),
    subtypeNames: document.subtypes.map((s) => s.name),
    format: document.format,
  });

  if (!appTheme || appTheme.mode === "light") {
    return base;
  }

  return adaptCategoryThemeForDark(base, appTheme);
}
