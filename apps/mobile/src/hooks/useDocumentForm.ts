import { useCallback, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { uploadFileFromUri, classifyDocumentFromUri } from "@helu/api";
import {
  useDocumentFormCore,
  type DocumentFormState,
  type DocumentFormActions,
} from "@helu/api/hooks";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { notify } from "../lib/notify";
import { useRecentlySaved } from "../lib/recentlySaved";

export type { DocumentFormState, DocumentFormActions };

export interface FileSource {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

type UseDocumentFormOptions = {
  backpackId?: string;
  backpackName?: string;
  /** Si se define, no hace goBack automático al terminar la subida. */
  onUploaded?: (doc: { id: string; title: string }) => void;
  skipNavigateBackOnUpload?: boolean;
};

type Upload = { storagePath: string };

export interface PreUpload {
  /** 0–100 while the file goes up; 100 once it is stored. */
  progress: number;
  done: boolean;
  failed: boolean;
}

/**
 * Mobile adapter of `useDocumentFormCore`. The file starts uploading as soon as it is picked
 * (mockup «Subir documento · subiendo»), and saving reuses that upload instead of sending the file
 * twice: `adapters.upload` returns the upload already in flight for the same file.
 */
export function useDocumentForm(
  options?: UseDocumentFormOptions,
): DocumentFormState &
  DocumentFormActions<FileSource> & {
    preUpload: PreUpload | null;
    startPreUpload: (file: FileSource) => void;
    /** The AI could not read the file (the fields stay as they are). */
    aiFailed: boolean;
    classify: (file: FileSource) => Promise<void>;
    /** The upload already in flight for this file, or a new one (edit: «Reemplazar»). */
    uploadFile: (file: FileSource) => Promise<Upload>;
  } {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const inFlight = useRef(new Map<string, Promise<Upload>>());
  const [preUpload, setPreUpload] = useState<PreUpload | null>(null);
  const [aiFailed, setAiFailed] = useState(false);

  const upload = useCallback((file: FileSource, onProgress?: (percent: number) => void) => {
    const existing = inFlight.current.get(file.uri);
    if (existing) {
      onProgress?.(100);
      return existing;
    }
    const started = uploadFileFromUri(file.uri, file.name, file.mimeType, onProgress);
    inFlight.current.set(file.uri, started);
    // A failed upload is retried on save instead of returning the same rejection.
    started.catch(() => inFlight.current.delete(file.uri));
    return started;
  }, []);

  const startPreUpload = useCallback(
    (file: FileSource) => {
      setPreUpload({ progress: 0, done: false, failed: false });
      upload(file, (percent) => setPreUpload((p) => (p && !p.done ? { ...p, progress: Math.min(99, Math.round(percent)) } : p)))
        .then(() => setPreUpload({ progress: 100, done: true, failed: false }))
        .catch(() => setPreUpload({ progress: 0, done: false, failed: true }));
    },
    [upload],
  );

  const onUploadComplete = useCallback(() => {
    if (!options?.skipNavigateBackOnUpload) navigation.goBack();
  }, [navigation, options?.skipNavigateBackOnUpload]);

  const onError = useCallback((title: string, message: string) => {
    notify({ tone: "error", message: title, description: message || undefined });
  }, []);

  const core = useDocumentFormCore<FileSource>({
    onUploaded: (doc) => {
      // The new document enters the list with the 1.2 s highlight (§6).
      useRecentlySaved.getState().markDocument(doc.id);
      options?.onUploaded?.(doc);
    },
    adapters: {
      classify: (file) => classifyDocumentFromUri(file.uri, file.name, file.mimeType),
      upload,
      getFileSize: (file) => file.size,
      getMimeType: (file) => file.mimeType,
      onError,
      // The AI step has its own inline state; a failure is said in the form, not in a toast.
      onClassifyError: () => setAiFailed(true),
      onUploadSuccess: (title, desc) => notify({ message: title, description: desc }),
      onUploadComplete,
    },
    backpackId: options?.backpackId,
    backpackName: options?.backpackName,
  });

  const { handleAIClassify } = core;
  const classify = useCallback(
    async (file: FileSource) => {
      setAiFailed(false);
      await handleAIClassify(file);
    },
    [handleAIClassify],
  );

  return { ...core, preUpload, startPreUpload, aiFailed, classify, uploadFile: upload };
}
