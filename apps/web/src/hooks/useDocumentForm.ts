import { useCallback } from "react";
import { sileo } from "sileo";
import { uploadFile, classifyDocument } from "@healthguard/api";
import {
  useDocumentFormCore,
  type DocumentFormState,
  type DocumentFormActions,
} from "@healthguard/api/hooks";

export type { DocumentFormState, DocumentFormActions };

type UseDocumentFormOptions = {
  backpackId?: string;
  backpackName?: string;
  onSuccess?: () => void;
};

export function useDocumentForm(
  options?: UseDocumentFormOptions,
): DocumentFormState & DocumentFormActions<File> {
  const onUploadComplete = useCallback(() => {
    options?.onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.onSuccess]);

  return useDocumentFormCore<File>({
    adapters: {
      classify:         (file) => classifyDocument(file),
      upload:           (file) => uploadFile(file),
      getFileSize:      (file) => file.size,
      getMimeType:      (file) => file.type || "application/octet-stream",
      onError:          (title, msg) => sileo.error({ title, description: msg }),
      onUploadSuccess:  (title, desc) => sileo.success({ title, description: desc }),
      onUploadComplete,
    },
    backpackId:  options?.backpackId,
    backpackName: options?.backpackName,
  });
}
