import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import {
  uploadFileFromUri,
  createDocument,
  getDocumentTypes,
  getTagCategories,
  classifyDocumentFromUri,
  createCustomTag,
  createTagCategory,
  addTagValue,
  type DocumentTypeOut,
  type TagCategoryOut,
  type ClassificationSuggestion,
} from "@healthguard/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface FileSource {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface DocumentFormState {
  catalogs: { types: DocumentTypeOut[]; tags: TagCategoryOut[] };
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

export interface DocumentFormActions {
  setSelectedType: (id: string | undefined) => void;
  setSelectedSpecialty: (id: string | undefined) => void;
  toggleTag: (tagId: string) => void;
  setTitle: (title: string) => void;
  setNewTagValue: (categoryId: string, text: string) => void;
  setNewCategoryName: (name: string) => void;
  setNewTagValueField: (val: string) => void;
  handleAIClassify: (file: FileSource) => Promise<void>;
  handleUpload: (file: FileSource) => Promise<void>;
  handleAddCustomTag: (categoryId: string) => Promise<void>;
  handleAddCategoryAndTag: () => Promise<void>;
}

export function useDocumentForm(): DocumentFormState & DocumentFormActions {
  const queryClient = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  const setNewTagValueForCategory = useCallback((categoryId: string, text: string) => {
    setNewTagValues((prev) => ({ ...prev, [categoryId]: text }));
  }, []);

  async function applyClassificationTags(result: ClassificationSuggestion) {
    const customTags = result.customTags ?? [];
    const newTags = result.newTags ?? [];
    const tagIds: string[] = customTags.map((ct) => ct.tagValueId);

    for (const nt of newTags) {
      if (nt.categoryId && nt.value) {
        try {
          const created = await addTagValue(nt.categoryId, nt.value);
          tagIds.push(created.id);
        } catch {
          // per-tag creation may fail if it already exists
        }
      }
    }

    if (tagIds.length) {
      setSelectedTags((prev) => [...new Set([...prev, ...tagIds])]);
    }

    const tags = await getTagCategories();
    setCatalogs((prev) => ({ ...prev, tags }));
  }

  const handleAIClassify = useCallback(async (file: FileSource) => {
    if (classifying) return;
    try {
      setClassifying(true);
      setClassificationResult(null);

      let result: (ClassificationSuggestion & { title?: string }) | null = null;
      let lastErr: unknown;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          result = await classifyDocumentFromUri(file.uri, file.name, file.mimeType) as ClassificationSuggestion & { title?: string };
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < MAX_RETRIES) await delay(RETRY_BASE_MS * attempt);
        }
      }

      if (!result) throw lastErr;

      setClassificationResult(result);
      if (result.title) setTitle(result.title);
      if (result.type?.id) setSelectedType(result.type.id);
      if (result.specialties?.length) setSelectedSpecialty(result.specialties[0].id);

      await applyClassificationTags(result);
    } catch (err) {
      console.warn("Error classifying with AI", err);
      Alert.alert("IA no disponible", "No pudimos clasificar el documento automáticamente.");
    } finally {
      setClassifying(false);
    }
  }, [classifying]);

  const handleUpload = useCallback(async (file: FileSource) => {
    if (uploading) return;

    if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
      Alert.alert(
        "Archivo demasiado grande",
        `El tamaño máximo permitido es 25 MB. Tu archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB.`
      );
      return;
    }

    setUploading(true);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { storagePath } = await uploadFileFromUri(file.uri, file.name, file.mimeType);

        const today = new Date();
        await createDocument({
          title: title || `Documento ${today.toLocaleDateString()}`,
          fileUrl: storagePath,
          format: file.mimeType,
          file_size_bytes: file.size ?? 0,
          documentDate: today.toISOString(),
          typeId: selectedType,
          subtypeIds: [],
          specialtyIds: selectedSpecialty ? [selectedSpecialty] : [],
          tagValueIds: selectedTags,
        });

        queryClient.invalidateQueries({ queryKey: ["documents"] });
        navigation.goBack();
        return;
      } catch (err: any) {
        console.warn(`Upload attempt ${attempt}/${MAX_RETRIES} failed:`, err);

        if (attempt >= MAX_RETRIES) {
          const detail = err.fieldErrors
            ? Object.entries(err.fieldErrors).map(([f, m]) => `${f}: ${m}`).join("\n")
            : err.message || "Ha ocurrido un error inesperado";
          Alert.alert("Error de subida", detail);
        } else {
          await delay(RETRY_BASE_MS * Math.pow(2, attempt - 1));
        }
      }
    }

    setUploading(false);
  }, [uploading, title, selectedType, selectedSpecialty, selectedTags, queryClient, navigation]);

  const handleAddCustomTag = useCallback(async (categoryId: string) => {
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
      console.warn("Error creating custom tag", err);
      Alert.alert("Error", "No se pudo crear la etiqueta personalizada.");
    } finally {
      setAddingTag(null);
    }
  }, [newTagValues, addingTag]);

  const handleAddCategoryAndTag = useCallback(async () => {
    const catName = newCategoryName.trim();
    const val = newTagValue.trim();
    if (!catName || !val || addingCustomTag) return;

    try {
      setAddingCustomTag(true);
      const existing = catalogs.tags.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      const categoryId = existing
        ? existing.id
        : (await createTagCategory({ name: catName })).id;

      const created = await addTagValue(categoryId, val);
      const tags = await getTagCategories();
      setCatalogs((prev) => ({ ...prev, tags }));
      setSelectedTags((prev) => [...prev, created.id]);
      setNewCategoryName("");
      setNewTagValue("");
    } catch (err) {
      console.warn("Error adding category+tag", err);
      Alert.alert("Error", "No se pudo crear la categoría o la etiqueta.");
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
