import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import type { FileSource } from "../hooks/useDocumentForm";
import { getUriFileSizeBytes } from "./fileUriSize";

async function imageUriToDataUrl(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Combina varias fotos de escaneo en un único PDF para subir como un documento.
 */
export async function scanImagesToPdfFile(imageUris: string[]): Promise<FileSource> {
  if (imageUris.length === 0) {
    throw new Error("No hay imágenes para combinar");
  }

  const dataUrls = await Promise.all(imageUris.map(imageUriToDataUrl));
  const pagesHtml = dataUrls
    .map((src) => `<div class="page"><img src="${src}" alt="página escaneada" /></div>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 0; size: auto; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }
      .page {
        width: 100%;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        page-break-after: always;
        break-after: page;
      }
      .page:last-child { page-break-after: auto; break-after: auto; }
      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
    </style>
  </head>
  <body>${pagesHtml}</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });
  const size = await getUriFileSizeBytes(uri);

  return {
    uri,
    name: `scan-${Date.now()}.pdf`,
    mimeType: "application/pdf",
    size,
  };
}
