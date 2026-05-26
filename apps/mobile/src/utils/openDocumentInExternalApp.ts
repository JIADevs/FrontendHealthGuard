import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import type { DocFormat } from "@helu/ui";

export interface OpenDocumentInExternalAppParams {
  url: string;
  title: string;
  format: string;
  docFormat: DocFormat;
}

function extensionFromFormat(format: string, docFormat: DocFormat): string {
  const f = (format ?? "").toLowerCase();
  if (docFormat === "pdf" || f.includes("pdf")) return "pdf";
  if (f.includes("png")) return "png";
  if (f.includes("gif")) return "gif";
  if (f.includes("webp")) return "webp";
  if (f.includes("heic") || f.includes("heif")) return "heic";
  if (docFormat === "image") return "jpg";
  const extMatch = f.match(/\.([a-z0-9]{2,5})$/i);
  return extMatch?.[1] ?? "bin";
}

function mimeTypeFromFormat(format: string, docFormat: DocFormat): string {
  const f = (format ?? "").toLowerCase();
  if (docFormat === "pdf" || f.includes("pdf")) return "application/pdf";
  if (f.includes("png")) return "image/png";
  if (f.includes("gif")) return "image/gif";
  if (f.includes("webp")) return "image/webp";
  if (f.includes("heic") || f.includes("heif")) return "image/heic";
  if (docFormat === "image" || f.match(/image|jpg|jpeg/)) return "image/jpeg";
  return "application/octet-stream";
}

function utiFromMimeType(mimeType: string): string | undefined {
  switch (mimeType) {
    case "application/pdf":
      return "com.adobe.pdf";
    case "image/jpeg":
      return "public.jpeg";
    case "image/png":
      return "public.png";
    case "image/gif":
      return "com.compuserve.gif";
    case "image/heic":
      return "public.heic";
    default:
      return undefined;
  }
}

function sanitizeFileName(title: string, extension: string): string {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, " ")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);

  const base = normalized || "documento";
  const lower = base.toLowerCase();
  if (lower.endsWith(`.${extension}`)) return base;
  return `${base}.${extension}`;
}

/**
 * Descarga el archivo firmado y lo abre con la app predeterminada del sistema (Android)
 * o el selector de apps / compartir (iOS).
 */
export async function openDocumentInExternalApp(
  params: OpenDocumentInExternalAppParams,
): Promise<void> {
  const extension = extensionFromFormat(params.format, params.docFormat);
  const mimeType = mimeTypeFromFormat(params.format, params.docFormat);
  const fileName = sanitizeFileName(params.title, extension);
  const dest = `${FileSystem.cacheDirectory ?? ""}${fileName}`;

  if (!FileSystem.cacheDirectory) {
    throw new Error("No se pudo acceder al almacenamiento temporal del dispositivo.");
  }

  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  }

  const download = await FileSystem.downloadAsync(params.url, dest);
  const localUri = download.uri;

  if (Platform.OS === "android") {
    const contentUri = await FileSystem.getContentUriAsync(localUri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      type: mimeType,
      flags: 1,
    });
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("No hay aplicaciones disponibles para abrir este archivo.");
  }

  const uti = utiFromMimeType(mimeType);
  await Sharing.shareAsync(localUri, {
    mimeType,
    ...(uti ? { UTI: uti } : {}),
    dialogTitle: "Abrir documento",
  });
}
