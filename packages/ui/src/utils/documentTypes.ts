/**
 * Lógica de tipos de documentos médicos compartida entre web y mobile.
 * Provee colores semánticos por tipo y resolución de formato de archivo.
 */
import { colors } from "../tokens/tokens";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DocTypeVariant = {
  bg: string;
  iconColor: string;
};

export type DocFormat = "pdf" | "image" | "other";

// ─── Mapa de colores por tipo de documento médico ────────────────────────────

export const DOCUMENT_TYPE_VARIANTS: Record<string, DocTypeVariant> = {
  "Análisis de sangre":   { bg: colors.error[50],    iconColor: colors.error[600] },
  "Análisis de orina":    { bg: colors.amber[100],   iconColor: colors.amber[600] },
  "Radiografía":          { bg: colors.yellow[100],  iconColor: colors.yellow[600] },
  "Ecografía":            { bg: colors.primary[100], iconColor: colors.primary[600] },
  "Tomografía":           { bg: colors.violet[100],  iconColor: colors.violet[600] },
  "Resonancia magnética": { bg: colors.violet[100],  iconColor: colors.violet[600] },
  "Receta":               { bg: colors.green[100],   iconColor: colors.green[600] },
  "Informe médico":       { bg: colors.sky[100],     iconColor: colors.sky[600] },
  "Historia clínica":     { bg: colors.green[50],    iconColor: colors.green[700] },
  "Vacuna":               { bg: colors.pink[100],    iconColor: colors.pink[600] },
  "Odontología":          { bg: colors.orange[50],   iconColor: colors.orange[600] },
};

const DEFAULT_VARIANT: DocTypeVariant = {
  bg: colors.sky[100],
  iconColor: colors.sky[500],
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
