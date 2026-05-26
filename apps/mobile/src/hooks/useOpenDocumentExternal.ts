import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";
import type { DocFormat } from "@helu/ui";
import { openDocumentInExternalApp } from "../utils/openDocumentInExternalApp";

export interface OpenDocumentExternalInput {
  url: string;
  title: string;
  format: string;
  docFormat: DocFormat;
}

export function useOpenDocumentExternal() {
  const [opening, setOpening] = useState(false);

  const openDocument = useCallback(async (input: OpenDocumentExternalInput) => {
    if (!input.url) {
      Toast.show({
        type: "error",
        text1: "Archivo no disponible",
        text2: "Espera a que cargue el documento e inténtalo de nuevo.",
      });
      return;
    }

    setOpening(true);
    try {
      await openDocumentInExternalApp(input);
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : "No se pudo abrir el documento. Verifica que tengas una app compatible instalada.";
      Toast.show({
        type: "error",
        text1: "No se pudo abrir",
        text2: message,
      });
    } finally {
      setOpening(false);
    }
  }, []);

  return { openDocument, opening };
}
