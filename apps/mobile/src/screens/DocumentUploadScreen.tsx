import { useCallback } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";
import { DocumentUpload } from "../components/documents/DocumentUpload";

/** Route only: «Subir archivo» lives in `components/documents/DocumentUpload` (rule 4.7). */
export function DocumentUploadScreen() {
  const navigation = useNavigation();
  const params = useRoute<RouteProp<RootStackParamList, "DocumentUpload">>().params;

  // Adapts `beforeRemove` so the form can ask «¿Descartar los cambios?» before leaving (formularios.md §7).
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) => navigation.addListener("beforeRemove", (event) => handler(() => event.preventDefault())),
    [navigation],
  );

  return (
    <DocumentUpload
      onClose={() => navigation.goBack()}
      subscribeBeforeLeave={subscribeBeforeLeave}
      backpackId={params?.backpackId}
      backpackName={params?.backpackName}
      initialFile={params?.scannedFile}
    />
  );
}
