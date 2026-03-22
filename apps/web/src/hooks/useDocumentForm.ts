import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import {
  uploadFile,
  createDocument,
  addDocToBackpack,
  getDocumentTypes,
  getTagCategories,
  classifyDocument,
  createCustomTag,
  createTagCategory,
  addTagValue,
  isApiError,
  type DocumentTypeOut,
  type TagCategoryOut,
  type ClassificationSuggestion,
} from "@healthguard/api";
import { RETRY_MAX_ATTEMPTS, RETRY_BASE_DELAY_MS, UPLOAD_MAX_FILE_SIZE_BYTES } from "@healthguard/ui";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface DocumentFormState {
  catalogs: { types: DocumentTypeOut[]; tags: TagCategoryOut[] };
  selectedType: string | undefined;
  selectedSpecialty: string | undefined;
  selectedTags: string[];
  title: string;
  newTagValues: Record<string, string>;
  addingTag: string | null;
  classificationResult: (ClassificationSuggestion & { title?: string }) | null;
  newCategoryName: string;
  newTagValue: string;
  addingCustomTag: boolean;
  uploading: boolean;
  classifying: boolean;
}

export interface DocumentFormActions {
  setSelectedType: (id: string | undefined) => void;
  setSelectedSpecialty: (id: string | undefined) => void;
  toggleTag: (tagId: string) => void;
  setSelectedTags: (tagIds: string[]) => void;
  setTitle: (title: string) => void;
  setNewTagValue: (categoryId: string, text: string) => void;
  setNewCategoryName: (name: string) => void;
  setNewTagValueField: (val: string) => void;
  handleAIClassify: (file: File) => Promise<void>;
  handleUpload: (file: File, docDate?: string) => Promise<void>;
  handleAddCustomTag: (categoryId: string) => Promise<void>;
  handleAddCategoryAndTag: () => Promise<void>;
}

type UseDocumentFormOptions = {
  backpackId?: string;
  backpackName?: string;
  onSuccess?: () => void;
};

export function useDocumentForm(
  options?: UseDocumentFormOptions,
): DocumentFormState & DocumentFormActions {
  const queryClient = useQueryClient();

  const [catalogs, setCatalogs] = useState<{ types: DocumentTypeOut[]; tags: TagCategoryOut[] }>({
    types: [],
    tags: [],
  });
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [newTagValues, setNewTagValues] = useState<Record<string, string>>({});
  const [addingTag, setAddingTag] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<
    (ClassificationSuggestion & { title?: string }) | null
  >(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const [addingCustomTag, setAddingCustomTag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchCatalogs() {
      try {
        const [types, tags] = await Promise.all([getDocumentTypes(), getTagCategories()]);
        if (!cancelled) setCatalogs({ types, tags });
      } catch (err) {
        console.warn("Error fetching catalogs", err);
      }
    }
    fetchCatalogs();
    return () => { cancelled = true; };
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  const setNewTagValueForCategory = useCallback((categoryId: string, text: string) => {
    setNewTagValues((prev) => ({ ...prev, [categoryId]: text }));
  }, []);

  const applyClassificationTags = useCallback(async (result: ClassificationSuggestion) => {
    const customTags = result.customTags ?? [];
    const newTags = result.newTags ?? [];
    const tagIds: string[] = customTags.map((ct) => ct.tagValueId);

    for (const nt of newTags) {
      if (nt.categoryId && nt.value) {
        try {
          const created = await addTagValue(nt.categoryId, nt.value);
          tagIds.push(created.id);
        } catch {
          // tag may already exist
        }
      }
    }

    if (tagIds.length) {
      setSelectedTags((prev) => [...new Set([...prev, ...tagIds])]);
    }

    const tags = await getTagCategories();
    setCatalogs((prev) => ({ ...prev, tags }));
  }, []);

  const handleAIClassify = useCallback(
    async (file: File) => {
      if (classifying) return;
      try {
        setClassifying(true);
        setClassificationResult(null);

        let result: (ClassificationSuggestion & { title?: string }) | null = null;
        let lastErr: unknown;

        for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
          try {
            result = (await classifyDocument(file)) as ClassificationSuggestion & { title?: string };
            break;
          } catch (err) {
            lastErr = err;
            const isRetryable = isApiError(err)
              ? err.isNetworkError
              : !(err instanceof SyntaxError || err instanceof TypeError);
            if (!isRetryable || attempt >= RETRY_MAX_ATTEMPTS) break;
            await delay(RETRY_BASE_DELAY_MS * attempt);
          }
        }

        if (!result) throw lastErr;

        setClassificationResult(result);
        if (result.title) setTitle(result.title);
        if (result.type?.id) setSelectedType(result.type.id);
        if (result.specialties?.length) setSelectedSpecialty(result.specialties[0]!.id);

        await applyClassificationTags(result);
      } catch (err) {
        const msg = isApiError(err) ? err.message : "No pudimos clasificar el documento automáticamente.";
        sileo.error({ title: "IA no disponible", description: msg });
      } finally {
        setClassifying(false);
      }
    },
    [classifying, applyClassificationTags],
  );

  const handleUpload = useCallback(
    async (file: File, docDate?: string) => {
      if (uploading) return;

      if (file.size > UPLOAD_MAX_FILE_SIZE_BYTES) {
        sileo.error({
          title: "Archivo demasiado grande",
          description: `El tamaño máximo permitido es 25 MB. Tu archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
        });
        return;
      }

      setUploading(true);
      try {
        for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
          try {
            const { storagePath } = await uploadFile(file);
            const today = new Date();
            const docTitle = title || `Documento ${today.toLocaleDateString()}`;
            const createdDoc = await createDocument({
              title: docTitle,
              fileUrl: storagePath,
              format: file.type || "application/octet-stream",
              file_size_bytes: file.size,
              documentDate: docDate ?? today.toISOString(),
              typeId: selectedType,
              subtypeIds: [],
              specialtyIds: selectedSpecialty ? [selectedSpecialty] : [],
              tagValueIds: selectedTags,
            });

            if (options?.backpackId) {
              await addDocToBackpack(options.backpackId, createdDoc.id);
              queryClient.invalidateQueries({ queryKey: ["backpack-docs", options.backpackId], exact: false });
              queryClient.invalidateQueries({ queryKey: ["backpack", options.backpackId], exact: false });
            }

            queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
            sileo.success({
              title: options?.backpackId ? "Documento subido y agregado a la mochila" : "Documento creado",
              description: options?.backpackName ?? docTitle,
            });
            options?.onSuccess?.();
            return;
          } catch (err) {
            if (attempt >= RETRY_MAX_ATTEMPTS) {
              let detail = "Ha ocurrido un error inesperado";
              if (isApiError(err)) {
                detail = err.fieldErrors
                  ? Object.entries(err.fieldErrors).map(([f, m]) => `${f}: ${m}`).join("\n")
                  : err.message;
              } else if (err instanceof Error) {
                detail = err.message;
              }
              sileo.error({ title: "No se pudo subir el documento", description: detail });
            } else {
              await delay(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
            }
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [uploading, title, selectedType, selectedSpecialty, selectedTags, queryClient, options],
  );

  const handleAddCustomTag = useCallback(
    async (categoryId: string) => {
      const value = newTagValues[categoryId];
      if (!value?.trim() || addingTag) return;

      try {
        setAddingTag(categoryId);
        const newTag = await createCustomTag({ categoryId, value: value.trim() });
        const tags = await getTagCategories();
        setCatalogs((prev) => ({ ...prev, tags }));
        setSelectedTags((prev) => [...prev, newTag.id]);
        setNewTagValues((prev) => ({ ...prev, [categoryId]: "" }));
      } catch (err) {
        const msg = isApiError(err) ? err.message : "No se pudo crear la etiqueta.";
        sileo.error({ title: "Error", description: msg });
      } finally {
        setAddingTag(null);
      }
    },
    [newTagValues, addingTag],
  );

  const handleAddCategoryAndTag = useCallback(async () => {
    const catName = newCategoryName.trim();
    const val = newTagValue.trim();
    if (!catName || !val || addingCustomTag) return;

    try {
      setAddingCustomTag(true);
      const existing = catalogs.tags.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      const categoryId = existing ? existing.id : (await createTagCategory({ name: catName })).id;

      const created = await addTagValue(categoryId, val);
      const tags = await getTagCategories();
      setCatalogs((prev) => ({ ...prev, tags }));
      setSelectedTags((prev) => [...prev, created.id]);
      setNewCategoryName("");
      setNewTagValue("");
    } catch (err) {
      const msg = isApiError(err) ? err.message : "No se pudo crear la categoría o la etiqueta.";
      sileo.error({ title: "Error", description: msg });
    } finally {
      setAddingCustomTag(false);
    }
  }, [newCategoryName, newTagValue, addingCustomTag, catalogs.tags]);

  return {
    catalogs,
    selectedType,
    selectedSpecialty,
    selectedTags,
    title,
    newTagValues,
    addingTag,
    classificationResult,
    newCategoryName,
    newTagValue,
    addingCustomTag,
    uploading,
    classifying,

    setSelectedType,
    setSelectedSpecialty,
    toggleTag,
    setSelectedTags,
    setTitle,
    setNewTagValue: setNewTagValueForCategory,
    setNewCategoryName,
    setNewTagValueField: setNewTagValue,
    handleAIClassify,
    handleUpload,
    handleAddCustomTag,
    handleAddCategoryAndTag,
  };
}
