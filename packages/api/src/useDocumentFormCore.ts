/**
 * useDocumentFormCore — lógica de formulario de documentos, agnóstica de plataforma.
 *
 * Cada plataforma provee un objeto `adapters` con las funciones específicas
 * (upload, classify, notificaciones, navegación). Este hook maneja todo el estado,
 * catálogos, clasificación IA y subida con reintentos.
 *
 * Uso:
 *   Web:    useDocumentFormCore({ adapters: webAdapters, ... })
 *   Mobile: useDocumentFormCore({ adapters: mobileAdapters, ... })
 */

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    getDocumentTypes,
    getTagCategories,
    addTagValue,
    createCustomTag,
    createTagCategory,
    createDocument,
    addDocToBackpack,
} from "./endpoints";
import { isApiError } from "./errors";
import type { DocumentTypeOut, TagCategoryOut, ClassificationSuggestion } from "./schemas";
import { retryAsync, RETRY_MAX_ATTEMPTS, RETRY_BASE_DELAY_MS, UPLOAD_MAX_FILE_SIZE_BYTES } from "./utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentFormState {
    catalogs: { types: DocumentTypeOut[]; tags: TagCategoryOut[] };
    catalogsLoading: boolean;
    selectedType: string | undefined;
    selectedSpecialty: string | undefined;
    selectedTags: string[];
    title: string;
    newTagValues: Record<string, string>;
    addingTag: string | null;
    classificationResult: ClassificationSuggestion | null;
    newCategoryName: string;
    newTagValue: string;
    addingCustomTag: boolean;
    uploading: boolean;
    classifying: boolean;
}

export interface DocumentFormActions<TFile> {
    setSelectedType: (id: string | undefined) => void;
    setSelectedSpecialty: (id: string | undefined) => void;
    toggleTag: (tagId: string) => void;
    setSelectedTags: (tagIds: string[]) => void;
    setTitle: (title: string) => void;
    setNewTagValue: (categoryId: string, text: string) => void;
    setNewCategoryName: (name: string) => void;
    setNewTagValueField: (val: string) => void;
    handleAIClassify: (file: TFile) => Promise<void>;
    handleUpload: (file: TFile, docDate?: string) => Promise<void>;
    handleAddCustomTag: (categoryId: string) => Promise<void>;
    handleAddCategoryAndTag: () => Promise<void>;
}

/**
 * Platform-specific callbacks injected into the core hook.
 * TFile is `File` on web, `FileSource` on mobile.
 */
export interface DocumentFormAdapters<TFile> {
    /** Classify a document file via AI and return the suggestion. */
    classify: (file: TFile) => Promise<ClassificationSuggestion>;
    /** Upload a file to storage and return its storage path. */
    upload: (file: TFile) => Promise<{ storagePath: string }>;
    /** Return the byte size of the file (for size validation). */
    getFileSize: (file: TFile) => number | undefined;
    /** Return the MIME type of the file (stored in createDocument.format). */
    getMimeType: (file: TFile) => string;
    /** Show an error notification. */
    onError: (title: string, message: string) => void;
    /** Show a success notification after upload. */
    onUploadSuccess: (title: string, description: string) => void;
    /** Called after a successful upload (e.g. navigation.goBack() or onSuccess()). */
    onUploadComplete: () => void;
}

export type UseDocumentFormCoreOptions<TFile> = {
    adapters: DocumentFormAdapters<TFile>;
    backpackId?: string;
    backpackName?: string;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentFormCore<TFile>(
    options: UseDocumentFormCoreOptions<TFile>,
): DocumentFormState & DocumentFormActions<TFile> {
    const { adapters, backpackId, backpackName } = options;
    const queryClient = useQueryClient();

    const [catalogs, setCatalogs] = useState<{ types: DocumentTypeOut[]; tags: TagCategoryOut[] }>({
        types: [],
        tags: [],
    });
    const [catalogsLoading, setCatalogsLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [newTagValues, setNewTagValues] = useState<Record<string, string>>({});
    const [addingTag, setAddingTag] = useState<string | null>(null);
    const [classificationResult, setClassificationResult] = useState<ClassificationSuggestion | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newTagValue, setNewTagValue] = useState("");
    const [addingCustomTag, setAddingCustomTag] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [classifying, setClassifying] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function fetchCatalogs() {
            try {
                setCatalogsLoading(true);
                const [types, tags] = await Promise.all([getDocumentTypes(), getTagCategories()]);
                if (!cancelled) setCatalogs({ types, tags });
            } catch (err) {
                console.warn("Error fetching catalogs", err);
            } finally {
                if (!cancelled) setCatalogsLoading(false);
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
        const tagIds: string[] = (result.customTags ?? []).map((ct) => ct.tagValueId);

        for (const nt of result.newTags ?? []) {
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
        async (file: TFile) => {
            if (classifying) return;
            try {
                setClassifying(true);
                setClassificationResult(null);

                const result = await retryAsync(() => adapters.classify(file), {
                    maxAttempts: RETRY_MAX_ATTEMPTS,
                    baseDelayMs: RETRY_BASE_DELAY_MS,
                });

                setClassificationResult(result);
                if (result.title) setTitle(result.title);
                if (result.type?.id) setSelectedType(result.type.id);
                if (result.specialties?.length) setSelectedSpecialty(result.specialties[0]!.id);

                await applyClassificationTags(result);
            } catch (err) {
                const msg = isApiError(err) ? err.message : "No pudimos clasificar el documento automáticamente.";
                adapters.onError("IA no disponible", msg);
            } finally {
                setClassifying(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [classifying, applyClassificationTags, adapters.classify, adapters.onError],
    );

    const handleUpload = useCallback(
        async (file: TFile, docDate?: string) => {
            if (uploading) return;

            const fileSize = adapters.getFileSize(file);
            if (fileSize !== undefined && fileSize > UPLOAD_MAX_FILE_SIZE_BYTES) {
                adapters.onError(
                    "Archivo demasiado grande",
                    `El tamaño máximo permitido es 25 MB. Tu archivo pesa ${(fileSize / (1024 * 1024)).toFixed(1)} MB.`,
                );
                return;
            }

            setUploading(true);
            try {
                const today = new Date();
                const docTitle = title || `Documento ${today.toLocaleDateString()}`;

                const { storagePath } = await retryAsync(() => adapters.upload(file), {
                    maxAttempts: RETRY_MAX_ATTEMPTS,
                    baseDelayMs: RETRY_BASE_DELAY_MS,
                });

                const createdDoc = await createDocument({
                    title: docTitle,
                    fileUrl: storagePath,
                    format: adapters.getMimeType(file),
                    file_size_bytes: fileSize ?? 0,
                    documentDate: docDate ?? today.toISOString(),
                    typeId: selectedType,
                    subtypeIds: [],
                    specialtyIds: selectedSpecialty ? [selectedSpecialty] : [],
                    tagValueIds: selectedTags,
                });

                if (backpackId) {
                    await addDocToBackpack(backpackId, createdDoc.id);
                    queryClient.invalidateQueries({ queryKey: ["backpack-docs", backpackId], exact: false });
                    queryClient.invalidateQueries({ queryKey: ["backpack", backpackId], exact: false });
                }

                queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
                adapters.onUploadSuccess(
                    backpackId ? "Documento subido y agregado a la mochila" : "Documento creado",
                    backpackName ?? docTitle,
                );
                adapters.onUploadComplete();
            } catch (err) {
                let detail = "Ha ocurrido un error inesperado";
                if (isApiError(err)) {
                    detail = err.fieldErrors
                        ? Object.entries(err.fieldErrors).map(([f, m]) => `${f}: ${m}`).join("\n")
                        : err.message;
                } else if (err instanceof Error) {
                    detail = err.message;
                }
                adapters.onError("No se pudo subir el documento", detail);
            } finally {
                setUploading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [uploading, title, selectedType, selectedSpecialty, selectedTags, queryClient, backpackId, backpackName,
            adapters.upload, adapters.getMimeType, adapters.getFileSize, adapters.onError,
            adapters.onUploadSuccess, adapters.onUploadComplete],
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
                adapters.onError("Error", msg);
            } finally {
                setAddingTag(null);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [newTagValues, addingTag, adapters.onError],
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
            adapters.onError("Error", msg);
        } finally {
            setAddingCustomTag(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newCategoryName, newTagValue, addingCustomTag, catalogs.tags, adapters.onError]);

    return {
        catalogs,
        catalogsLoading,
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
