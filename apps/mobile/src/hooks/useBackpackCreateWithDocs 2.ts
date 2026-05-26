import { useCallback, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { useDocumentsQuery, useCreateBackpackMutation } from "@helu/api/hooks";
import { addDocToBackpack, isApiError } from "@helu/api";
import { useDebounceSearch } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";

const DOCS_FETCH_LIMIT = 50;

export function useBackpackCreateWithDocs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [docSearch, setDocSearch] = useState("");
  const debouncedDocSearch = useDebounceSearch(docSearch);
  const [creating, setCreating] = useState(false);

  const docsQuery = useDocumentsQuery(debouncedDocSearch, 1, DOCS_FETCH_LIMIT);
  const documents = useMemo(() => docsQuery.data?.items ?? [], [docsQuery.data]);

  const createMut = useCreateBackpackMutation();

  const toggleDocument = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Toast.show({
        type: "error",
        text1: "Nombre requerido",
        text2: "Ingresá un nombre para la mochila.",
      });
      return;
    }

    setCreating(true);
    let backpackId: string | null = null;

    try {
      const backpack = await createMut.mutateAsync({
        name: trimmed,
        description: description.trim() || undefined,
        type: "CUSTOM",
      });
      backpackId = backpack.id;

      const ids = [...selectedIds];
      const failedIds: string[] = [];

      for (const documentId of ids) {
        try {
          await addDocToBackpack(backpack.id, documentId);
        } catch {
          failedIds.push(documentId);
        }
      }

      if (failedIds.length > 0 && failedIds.length < ids.length) {
        Toast.show({
          type: "info",
          text1: "Mochila creada",
          text2: `Se agregaron ${ids.length - failedIds.length} de ${ids.length} documentos.`,
        });
      } else if (failedIds.length > 0) {
        Toast.show({
          type: "error",
          text1: "Mochila creada sin documentos",
          text2: "No se pudieron vincular los documentos seleccionados.",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Mochila creada",
          text2: trimmed,
        });
      }

      navigation.replace("BackpackDetail", { id: backpack.id });
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : backpackId
          ? "La mochila se creó pero hubo un problema al finalizar."
          : "No se pudo crear la mochila.";

      Toast.show({ type: "error", text1: "Error", text2: message });

      if (backpackId) {
        navigation.replace("BackpackDetail", { id: backpackId });
      }
    } finally {
      setCreating(false);
    }
  }, [name, description, selectedIds, createMut, navigation]);

  return {
    name,
    setName,
    description,
    setDescription,
    docSearch,
    setDocSearch,
    documents,
    documentsLoading: docsQuery.isLoading,
    selectedIds,
    toggleDocument,
    handleCreate,
    creating,
  };
}
