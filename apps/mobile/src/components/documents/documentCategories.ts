import type { Document } from "@helu/api";
import {
  Activity,
  ClipboardList,
  FileText,
  Globe,
  Image as ImageIcon,
  Pill,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react-native";

/**
 * Document categories for the list, filters and rows (#43, decision 1). They come from the API
 * catalog (`/documents/catalog/types`) plus portals (`kind = LINK`), not from keyword guessing.
 * Every category uses the document accent (sky), as in the mockup.
 */
export type DocumentCategory =
  | "results"
  | "images"
  | "formulas"
  | "orders"
  | "authorizations"
  | "history"
  | "other"
  | "portals";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "results",
  "images",
  "formulas",
  "orders",
  "authorizations",
  "history",
  "other",
  "portals",
];

/** API document type name → category. Unknown or missing types fall into «Otros». */
const TYPE_TO_CATEGORY: Record<string, DocumentCategory> = {
  "Examen de Laboratorio": "results",
  "Imagen Diagnóstica": "images",
  "Fórmula Médica": "formulas",
  // Misiones DU-45: the two types that suggest a mission (mockup 4c: «Hoy · Orden», «Autorización»).
  "Orden médica": "orders",
  "Autorización EPS": "authorizations",
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
  orders: { label: "Orden", plural: "Órdenes", icon: ClipboardList },
  authorizations: { label: "Autorización", plural: "Autorizaciones", icon: ShieldCheck },
  history: { label: "Historia clínica", plural: "Historia clínica", icon: Stethoscope },
  other: { label: "Documento", plural: "Otros", icon: FileText },
  portals: { label: "Portal", plural: "Portales", icon: Globe },
};

/** Category of an API document type name, for the type selector (mockup 13 «1B»). */
export function typeCategory(name: string | null | undefined): DocumentCategory {
  return (name && TYPE_TO_CATEGORY[name]) || "other";
}

/** Help line under each type in the type selector (mockup 13 «1B»). */
export const CATEGORY_HINT: Partial<Record<DocumentCategory, string>> = {
  history: "Resúmenes, epicrisis",
  results: "Sangre, orina y otros",
  images: "Rayos X, ecografía, resonancia",
  formulas: "Medicamentos recetados",
  orders: "Para un examen, terapia o cita",
  authorizations: "Aprobación de tu EPS",
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
  // Acronyms stay as they are: «Autorización EPS», not «Autorización eps».
  const lower = name
    .split(" ")
    .map((w) => (w.length > 1 && w === w.toLocaleUpperCase("es") ? w : w.toLocaleLowerCase("es")))
    .join(" ");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}
