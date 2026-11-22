import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Document } from "@helu/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useDocumentDeleteWithUndo } from "./useDocumentDeleteWithUndo";

export function useDocumentListActions() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const deleteDocument = useDocumentDeleteWithUndo();

  const handleView = useCallback(
    (doc: Document) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title }),
    [navigation],
  );
  const handleEdit = useCallback((doc: Document) => navigation.navigate("DocumentEdit", { id: doc.id }), [navigation]);

  return { handleView, handleEdit, handleDelete: deleteDocument };
}
