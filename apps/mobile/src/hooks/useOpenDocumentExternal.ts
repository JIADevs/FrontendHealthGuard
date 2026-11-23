import { useCallback, useState } from "react";
import { notify } from "../lib/notify";
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
      notify({ tone: "error", message: "El archivo todavía no está listo", description: "Espera a que cargue el documento e intenta de nuevo." });
      return;
    }

    setOpening(true);
    try {
      await openDocumentInExternalApp(input);
    } catch (err) {
      // MASTER §8: what happened + what to do, never the technical error.
      console.warn("[open document]", err);
      notify({
        tone: "error",
        message: "No se pudo abrir el documento",
        description: "Revisa que tengas una app para abrir este tipo de archivo e intenta de nuevo.",
      });
    } finally {
      setOpening(false);
    }
  }, []);

  return { openDocument, opening };
}
