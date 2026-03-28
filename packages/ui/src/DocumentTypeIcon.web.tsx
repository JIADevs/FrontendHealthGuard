import { FileText, FileImage, File } from "lucide-react";
import { resolveDocTypeVariant, resolveDocFormat } from "./documentTypes";

export interface DocumentTypeIconProps {
  format: string;
  documentTypeName?: string;
  size?: number;
}

export function DocumentTypeIcon({ format, documentTypeName, size = 24 }: DocumentTypeIconProps) {
  const { bg, iconColor } = resolveDocTypeVariant(documentTypeName);
  const fmt = resolveDocFormat(format);

  const Icon = fmt === "image" ? FileImage : fmt === "pdf" ? FileText : File;
  const containerSize = size * 2;

  return (
    <div
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize * 0.25,
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      title={documentTypeName ?? "Documento"}
    >
      <Icon size={size} color={iconColor} strokeWidth={2} />
    </div>
  );
}
