import { View, StyleSheet } from "react-native";
import { FileText, FileImage, File } from "lucide-react-native";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type DocumentTypeIconProps = {
  format: string;
  documentTypeName?: string;
  size?: number;
};

type IconVariant = {
  bg: string;
  iconColor: string;
};

// ─── Mapa de colores por tipo de documento médico ────────────────────────────

const TYPE_VARIANTS: Record<string, IconVariant> = {
  "Análisis de sangre":    { bg: "#fee2e2", iconColor: "#dc2626" },
  "Análisis de orina":     { bg: "#fef3c7", iconColor: "#d97706" },
  "Radiografía":           { bg: "#fef9c3", iconColor: "#ca8a04" },
  "Ecografía":             { bg: "#dbeafe", iconColor: "#2563eb" },
  "Tomografía":            { bg: "#ede9fe", iconColor: "#7c3aed" },
  "Resonancia magnética":  { bg: "#ede9fe", iconColor: "#7c3aed" },
  "Receta":                { bg: "#dcfce7", iconColor: "#16a34a" },
  "Informe médico":        { bg: "#e0f2fe", iconColor: "#0284c7" },
  "Historia clínica":      { bg: "#f0fdf4", iconColor: "#15803d" },
  "Vacuna":                { bg: "#fce7f3", iconColor: "#db2777" },
  "Odontología":           { bg: "#fff7ed", iconColor: "#ea580c" },
};

const DEFAULT_VARIANT: IconVariant = { bg: "#e0f2fe", iconColor: "#0ea5e9" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveVariant(documentTypeName?: string): IconVariant {
  if (!documentTypeName) return DEFAULT_VARIANT;
  if (TYPE_VARIANTS[documentTypeName]) return TYPE_VARIANTS[documentTypeName];

  // Color determinístico para tipos no mapeados
  const hue = [...documentTypeName].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return {
    bg: `hsl(${hue}, 60%, 93%)`,
    iconColor: `hsl(${hue}, 55%, 38%)`,
  };
}

function resolveIcon(format: string) {
  if (format.startsWith("image/")) return FileImage;
  if (format === "application/pdf") return FileText;
  return File;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function DocumentTypeIcon({ format, documentTypeName, size = 24 }: DocumentTypeIconProps) {
  const { bg, iconColor } = resolveVariant(documentTypeName);
  const Icon = resolveIcon(format);

  const containerSize = size * 2;
  const borderRadius = containerSize * 0.25;

  return (
    <View
      style={[styles.container, { width: containerSize, height: containerSize, borderRadius, backgroundColor: bg }]}
      accessibilityLabel={documentTypeName ?? "Documento"}
    >
      <Icon size={size} color={iconColor} strokeWidth={2} />
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
