import * as FileSystem from "expo-file-system/legacy";

/** Tamaño en bytes de un archivo local (file://). */
export async function getUriFileSizeBytes(uri: string): Promise<number | undefined> {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (!info.exists || info.isDirectory) return undefined;
    return typeof info.size === "number" && info.size > 0 ? info.size : undefined;
  } catch {
    return undefined;
  }
}
