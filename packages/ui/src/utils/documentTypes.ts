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

// ─── Mapa de colores por tipo de documento médico ────────────────────────────

export const DOCUMENT_TYPE_VARIANTS: Record<string, DocTypeVariant> = {
  "Análisis de sangre":   { bg: palette.status.error[50],    iconColor: palette.status.error[600] },
  "Análisis de orina":    { bg: palette.accent.medication[100],   iconColor: palette.accent.medication[600] },
  "Radiografía":          { bg: palette.status.warning[50],  iconColor: palette.status.warning[600] },
  "Ecografía":            { bg: palette.brand[100], iconColor: palette.brand[600] },
  "Tomografía":           { bg: palette.accent.ai[100],  iconColor: palette.accent.ai[600] },
  "Resonancia magnética": { bg: palette.accent.ai[100],  iconColor: palette.accent.ai[600] },
  "Receta":               { bg: palette.accent.document[100],   iconColor: palette.accent.document[600] },
  "Informe médico":       { bg: palette.brand[100],     iconColor: palette.brand[600] },
  "Historia clínica":     { bg: palette.accent.document[50],    iconColor: palette.accent.document[700] },
  "Vacuna":               { bg: palette.accent.calendar[100],    iconColor: palette.accent.calendar[600] },
  "Odontología":          { bg: palette.accent.backpack[50],   iconColor: palette.accent.backpack[600] },
};

const DEFAULT_VARIANT: DocTypeVariant = {
  bg: palette.brand[100],
  iconColor: palette.brand[500],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resuelve el color de fondo e ícono para un tipo de documento médico.
 * Para tipos desconocidos genera un color determinístico basado en el nombre.
 */
export function resolveDocTypeVariant(documentTypeName?: string): DocTypeVariant {
  if (!documentTypeName) return DEFAULT_VARIANT;
  if (DOCUMENT_TYPE_VARIANTS[documentTypeName]) return DOCUMENT_TYPE_VARIANTS[documentTypeName];

  // Color determinístico para tipos no mapeados
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
export function resolveDocFormat(format: string): DocFormat {
  const f = (format ?? "").toLowerCase();
  if (f.includes("pdf")) return "pdf";
  if (f.match(/image|jpg|jpeg|png|webp|heic|heif/)) return "image";
  return "other";
}
