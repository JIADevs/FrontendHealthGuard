import { View, StyleSheet } from "react-native";
import { FileText, FileImage, File } from "lucide-react-native";
import { colors } from "@healthguard/ui";

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
  "Análisis de sangre":    { bg: colors.error[50],    iconColor: colors.error[600] },
  "Análisis de orina":     { bg: colors.amber[100],   iconColor: colors.amber[600] },
  "Radiografía":           { bg: colors.yellow[100],  iconColor: colors.yellow[600] },
  "Ecografía":             { bg: colors.primary[100], iconColor: colors.primary[600] },
  "Tomografía":            { bg: colors.violet[100],  iconColor: colors.violet[600] },
  "Resonancia magnética":  { bg: colors.violet[100],  iconColor: colors.violet[600] },
  "Receta":                { bg: colors.green[100],   iconColor: colors.green[600] },
  "Informe médico":        { bg: colors.sky[100],     iconColor: colors.sky[600] },
  "Historia clínica":      { bg: colors.green[50],    iconColor: colors.green[700] },
  "Vacuna":                { bg: colors.pink[100],    iconColor: colors.pink[600] },
  "Odontología":           { bg: colors.orange[50],   iconColor: colors.orange[600] },
};

const DEFAULT_VARIANT: IconVariant = { bg: colors.sky[100], iconColor: colors.sky[500] };

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
