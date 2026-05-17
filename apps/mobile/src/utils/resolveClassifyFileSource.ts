import * as FileSystem from "expo-file-system/legacy";
import type { Document } from "@helu/api";
import type { FileSource } from "../hooks/useDocumentForm";

function extensionFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("webp")) return "webp";
  if (m.includes("heic")) return "heif";
  return "bin";
}

function safeFileName(title: string, mime: string): string {
  const base = title.trim().replace(/[^\w\s.-áéíóúñÁÉÍÓÚÑ]/g, "").slice(0, 80) || "documento";
  return `${base}.${extensionFromMime(mime)}`;
}

/**
 * Archivo listo para POST /documents/classify.
 * En edición usa el adjunto actual (descarga la URL firmada al caché si hace falta).
 */
export async function resolveClassifyFileSource(
  document: Document | undefined,
  signedUrl: string | undefined,
  replacementFile: FileSource | null,
): Promise<FileSource | undefined> {
  if (replacementFile) return replacementFile;
  if (!document || !signedUrl) return undefined;

  const mimeType = document.format || "application/octet-stream";
  const name = safeFileName(document.title, mimeType);

  if (signedUrl.startsWith("file://") || signedUrl.startsWith("content://")) {
    return {
      uri: signedUrl,
      name,
      mimeType,
      size: document.fileSizeBytes ?? undefined,
    };
  }

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error("Cache del dispositivo no disponible");
  }

  const dest = `${cacheDir}classify-${document.id}.${extensionFromMime(mimeType)}`;
  const cached = await FileSystem.getInfoAsync(dest);
  if (!cached.exists) {
    const result = await FileSystem.downloadAsync(signedUrl, dest);
    if (result.status !== 200) {
      throw new Error(`Descarga del adjunto falló (${result.status})`);
    }
  }

  return {
    uri: dest,
    name,
    mimeType,
    size: document.fileSizeBytes ?? undefined,
  };
}
