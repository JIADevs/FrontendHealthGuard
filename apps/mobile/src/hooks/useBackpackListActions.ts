import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { isApiError, type Backpack } from "@helu/api";
import { useDeleteBackpackMutation } from "@helu/api/hooks";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function useBackpackListActions() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [deleteTarget, setDeleteTarget] = useState<Backpack | null>(null);
  const deleteMut = useDeleteBackpackMutation();

  const handleView = useCallback(
    (backpack: Backpack) => {
      navigation.navigate("BackpackDetail", { id: backpack.id });
    },
    [navigation],
  );

  const handleEdit = useCallback(
    (backpack: Backpack) => {
      navigation.navigate("BackpackEdit", { id: backpack.id });
    },
    [navigation],
  );

  const requestDelete = useCallback((backpack: Backpack) => {
    setDeleteTarget(backpack);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        Toast.show({ type: "success", text1: "Mochila eliminada" });
      },
      onError: (err: unknown) => {
        const msg = isApiError(err) ? err.message : "No se pudo eliminar la mochila.";
        Toast.show({ type: "error", text1: "Error al eliminar", text2: msg });
      },
    });
  }, [deleteTarget, deleteMut]);

  return {
    handleView,
    handleEdit,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleteTarget,
    deletePending: deleteMut.isPending,
  };
}
