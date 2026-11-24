import type { Document } from "@helu/api";
import { Activity, FileText, Globe, Image as ImageIcon, Pill, Stethoscope, type LucideIcon } from "lucide-react-native";

/**
 * Document categories for the list, filters and rows (#43, decision 1). They come from the API
 * catalog (`/documents/catalog/types`) plus portals (`kind = LINK`), not from keyword guessing.
 * Every category uses the document accent (sky), as in the mockup.
 */
export type DocumentCategory = "results" | "images" | "formulas" | "history" | "other" | "portals";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = ["results", "images", "formulas", "history", "other", "portals"];

/** API document type name → category. Unknown or missing types fall into «Otros». */
const TYPE_TO_CATEGORY: Record<string, DocumentCategory> = {
  "Examen de Laboratorio": "results",
  "Imagen Diagnóstica": "images",
  "Fórmula Médica": "formulas",
  "Historia Clínica": "history",
  "Otro Documento": "other",
};

interface CategoryMeta {
  /** Singular, for a row's meta line: «28 oct · Resultado». */
  label: string;
  /** Plural, for filter chips. */
  plural: string;
  icon: LucideIcon;
}

export const CATEGORY_META: Record<DocumentCategory, CategoryMeta> = {
  results: { label: "Resultado", plural: "Resultados", icon: Activity },
  images: { label: "Imagen", plural: "Imágenes", icon: ImageIcon },
  formulas: { label: "Fórmula", plural: "Fórmulas", icon: Pill },
  history: { label: "Historia clínica", plural: "Historia clínica", icon: Stethoscope },
  other: { label: "Documento", plural: "Otros", icon: FileText },
  portals: { label: "Portal", plural: "Portales", icon: Globe },
};

export function categoryOf(doc: Pick<Document, "kind" | "documentType">): DocumentCategory {
  if (doc.kind === "LINK") return "portals";
  const name = doc.documentType?.name;
  return (name && TYPE_TO_CATEGORY[name]) || "other";
}

/** «Todos» plus every category, for the quick filter row and the filters sheet. */
export const CATEGORY_FILTER_OPTIONS: { value: DocumentCategory | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  ...DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].plural })),
];

/**
 * The server's document type catalog is in Title Case («Otro Documento», «Examen de Laboratorio»);
 * the app writes in sentence case (MASTER §9): «Otro documento», «Examen de laboratorio».
 */
export function documentTypeLabel(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  const lower = name.toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}
