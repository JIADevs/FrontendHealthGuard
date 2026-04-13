import { useCallback } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { uploadFileFromUri, classifyDocumentFromUri } from "@healthguard/api";
import { useAuthStore } from "@healthguard/stores";
import {
  useDocumentFormCore,
  type DocumentFormState,
  type DocumentFormActions,
} from "@healthguard/api/hooks";
import type { RootStackParamList } from "../navigation/RootNavigator";

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
};

export function useDocumentForm(
  options?: UseDocumentFormOptions,
): DocumentFormState & DocumentFormActions<FileSource> {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const onUploadComplete = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onError = useCallback((title: string, message: string) => {
    Toast.show({ type: "error", text1: title, text2: message });
    Alert.alert(title, message);
  }, []);

  const token = useAuthStore((s) => s.token);

  return useDocumentFormCore<FileSource>({
    adapters: {
      classify:        (file) => classifyDocumentFromUri(file.uri, file.name, file.mimeType),
      upload:          (file) => uploadFileFromUri(file.uri, file.name, file.mimeType),
      getFileSize:     (file) => file.size,
      getMimeType:     (file) => file.mimeType,
      onError,
      onUploadSuccess: (title, desc) => Toast.show({ type: "success", text1: title, text2: desc }),
      onUploadComplete,
    },
    backpackId:  options?.backpackId,
    backpackName: options?.backpackName,
    catalogFetchDeps: token,
  });
}
