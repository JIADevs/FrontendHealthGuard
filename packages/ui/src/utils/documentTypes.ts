/**
 * Lógica de tipos de documentos médicos compartida entre web y mobile.
 * Provee colores semánticos por tipo y resolución de formato de archivo.
 */
import { colors, palette } from "../tokens/tokens";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DocTypeVariant = {
  bg: string;
  iconColor: string;
};

export type DocFormat = "pdf" | "image" | "other";

export type DocumentCategoryKey =
  | "laboratory"
  | "cardiology"
  | "imaging"
  | "formula"
  | "history"
  | "vaccine"
  | "default";

export type DocumentCategoryTheme = DocTypeVariant & {
  key: DocumentCategoryKey;
  label: string;
  tagBg: string;
  tagText: string;
};

export interface DocumentCategoryInput {
  documentTypeName?: string | null;
  specialtyNames?: string[];
  subtypeNames?: string[];
  format?: string;
}

// ─── Mapa de colores por tipo de documento médico ────────────────────────────

export const DOCUMENT_TYPE_VARIANTS: Record<string, DocTypeVariant> = {
  "Examen de Laboratorio": { bg: palette.accent.document[50],  iconColor: palette.accent.document[600] },
  "Imagen Diagnóstica":    { bg: palette.brand[50],            iconColor: palette.brand[600] },
  "Fórmula Médica":        { bg: palette.accent.medication[50], iconColor: palette.accent.medication[700] },
  "Historia Clínica":      { bg: palette.brand[100],           iconColor: palette.brand[700] },
  "Otro Documento":        { bg: colors.slate[100],            iconColor: colors.slate[600] },
  "Análisis de sangre":    { bg: palette.accent.document[50],  iconColor: palette.accent.document[600] },
  "Análisis de orina":     { bg: palette.accent.document[50],  iconColor: palette.accent.document[600] },
  "Radiografía":           { bg: palette.brand[50],             iconColor: palette.brand[600] },
  "Ecografía":             { bg: palette.brand[50],             iconColor: palette.brand[600] },
  "Tomografía":            { bg: palette.accent.ai[50],          iconColor: palette.accent.ai[600] },
  "Resonancia magnética":  { bg: palette.accent.ai[50],          iconColor: palette.accent.ai[600] },
  "Receta":                { bg: palette.accent.medication[50], iconColor: palette.accent.medication[700] },
  "Informe médico":        { bg: palette.brand[100],            iconColor: palette.brand[600] },
  "Historia clínica":      { bg: palette.brand[100],            iconColor: palette.brand[700] },
  "Vacuna":                { bg: palette.accent.document[50],   iconColor: palette.accent.document[600] },
  "Odontología":           { bg: palette.accent.backpack[50],   iconColor: palette.accent.backpack[600] },
};

const CATEGORY_THEMES: Record<DocumentCategoryKey, DocumentCategoryTheme> = {
  laboratory: {
    key: "laboratory",
    label: "Laboratorio",
    bg: palette.accent.document[50],
    iconColor: palette.accent.document[600],
    tagBg: palette.accent.document[50],
    tagText: palette.accent.document[700],
  },
  cardiology: {
    key: "cardiology",
    label: "Cardiología",
    bg: colors.pink[50],
    iconColor: colors.pink[600],
    tagBg: palette.brand[50],
    tagText: palette.brand[700],
  },
  imaging: {
    key: "imaging",
    label: "Imágenes",
    bg: palette.brand[50],
    iconColor: palette.brand[600],
    tagBg: palette.brand[50],
    tagText: palette.brand[700],
  },
  formula: {
    key: "formula",
    label: "Fórmulas",
    bg: palette.accent.medication[50],
    iconColor: palette.accent.medication[700],
    tagBg: palette.accent.medication[50],
    tagText: palette.accent.medication[800],
  },
  history: {
    key: "history",
    label: "Historia clínica",
    bg: palette.brand[100],
    iconColor: palette.brand[700],
    tagBg: palette.brand[50],
    tagText: palette.brand[700],
  },
  vaccine: {
    key: "vaccine",
    label: "Vacunas",
    bg: palette.accent.document[50],
    iconColor: palette.accent.document[600],
    tagBg: palette.accent.document[50],
    tagText: palette.accent.document[700],
  },
  default: {
    key: "default",
    label: "Documento",
    bg: colors.slate[100],
    iconColor: colors.slate[600],
    tagBg: colors.slate[100],
    tagText: colors.slate[700],
  },
};

const DEFAULT_VARIANT: DocTypeVariant = CATEGORY_THEMES.default;

function includesAny(text: string, terms: string[]): boolean {
  const n = text.toLowerCase();
  return terms.some((t) => n.includes(t));
}

/** Categorías visibles en la barra rápida del listado. */
export const DOCUMENT_QUICK_FILTER_KEYS: (DocumentCategoryKey | null)[] = [
  null,
  "cardiology",
  "laboratory",
  "imaging",
];

/** Todas las categorías disponibles en el panel de filtros. */
export const DOCUMENT_FILTER_KEYS: (DocumentCategoryKey | null)[] = [
  null,
  "cardiology",
  "laboratory",
  "imaging",
  "formula",
  "history",
  "vaccine",
];

export function getDocumentFilterLabel(key: DocumentCategoryKey | null): string {
  if (key === null) return "Todos";
  return CATEGORY_THEMES[key].label;
}

export function inferDocumentCategoryKey(input: DocumentCategoryInput): DocumentCategoryKey {
  const typeName = input.documentTypeName ?? "";
  const specialties = (input.specialtyNames ?? []).join(" ");
  const subtypes = (input.subtypeNames ?? []).join(" ");
  const combined = `${typeName} ${specialties} ${subtypes}`.toLowerCase();

  if (includesAny(combined, ["cardiolog", "ecocardiograma", "electrocardiograma"])) {
    return "cardiology";
  }
  if (includesAny(combined, ["vacuna", "inmuniz", "esquema de vacun"])) {
    return "vaccine";
  }
  if (
    includesAny(combined, [
      "laboratorio",
      "examen de laboratorio",
      "hemograma",
      "análisis",
      "analisis",
      "uroanálisis",
      "coprológico",
      "perfil lipídico",
      "glucosa",
    ])
  ) {
    return "laboratory";
  }
  if (
    includesAny(combined, [
      "fórmula",
      "formula",
      "medicamento",
      "receta",
      "losartán",
      "prescripción",
    ])
  ) {
    return "formula";
  }
  if (
    includesAny(combined, [
      "imagen",
      "radiograf",
      "rayos x",
      "ecograf",
      "tomograf",
      "resonancia",
      "endoscop",
      "colonoscop",
    ])
  ) {
    return "imaging";
  }
  if (includesAny(combined, ["historia clínica", "consulta", "epicrisis", "evolución"])) {
    return "history";
  }

  const fmt = (input.format ?? "").toLowerCase();
  if (fmt.match(/image|jpg|jpeg|png|webp|heic/)) return "imaging";

  return "default";
}

/**
 * Tema visual completo (ícono + etiqueta) según tipo, especialidad y subtipo.
 */
export function resolveDocumentCategoryTheme(input: DocumentCategoryInput): DocumentCategoryTheme {
  const key = inferDocumentCategoryKey(input);
  const base = { ...CATEGORY_THEMES[key] };

  const specialty = input.specialtyNames?.[0];
  if (key === "cardiology" && specialty) {
    base.label = specialty;
  } else if (input.documentTypeName && key === "default") {
    base.label = input.documentTypeName;
  } else if (input.subtypeNames?.[0] && key === "default") {
    base.label = input.subtypeNames[0];
  }

  return base;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** True when the document is a portal link (no file attachment). */
export function isLinkDocument(kind?: string | null): boolean {
  return kind === "LINK";
}

/**
 * Resuelve el color de fondo e ícono para un tipo de documento médico.
 * Para tipos desconocidos usa categoría inferida o color determinístico.
 */
export function resolveDocTypeVariant(documentTypeName?: string): DocTypeVariant {
  if (!documentTypeName) return DEFAULT_VARIANT;
  if (DOCUMENT_TYPE_VARIANTS[documentTypeName]) {
    return DOCUMENT_TYPE_VARIANTS[documentTypeName];
  }

  const theme = resolveDocumentCategoryTheme({ documentTypeName });
  if (theme.key !== "default") {
    return { bg: theme.bg, iconColor: theme.iconColor };
  }

  const hue = [...documentTypeName].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return {
    bg: `hsl(${hue}, 60%, 93%)`,
    iconColor: `hsl(${hue}, 55%, 38%)`,
  };
}

/**
 * Normaliza el formato MIME/extensión a una de tres categorías:
 * "pdf" | "image" | "other"
 */
export function resolveDocFormat(format?: string | null): DocFormat {
  const f = (format ?? "").toLowerCase();
  if (f.includes("pdf")) return "pdf";
  if (f.match(/image|jpg|jpeg|png|webp|heic|heif/)) return "image";
  return "other";
}
