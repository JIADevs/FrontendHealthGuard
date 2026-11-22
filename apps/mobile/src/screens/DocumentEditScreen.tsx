import { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";
import { DocumentEdit } from "../components/documents/DocumentEdit";

/** Route only: «Editar documento» lives in `components/documents/DocumentEdit` (rule 4.7). */
export function DocumentEditScreen() {
  const navigation = useNavigation();
  const { id } = (useRoute().params ?? {}) as { id: string };

  // Adapts `beforeRemove` so the form can ask «¿Descartar los cambios?» before leaving (formularios.md §7).
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) => navigation.addListener("beforeRemove", (event) => handler(() => event.preventDefault())),
    [navigation],
  );

  return <DocumentEdit id={id} onClose={() => navigation.goBack()} subscribeBeforeLeave={subscribeBeforeLeave} />;
}
