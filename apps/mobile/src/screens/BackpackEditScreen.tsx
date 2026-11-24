import { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";
import { BackpackForm } from "../components/backpacks/BackpackForm";
import type { BackpackTemplate } from "../components/backpacks/BackpacksEmpty";

/** Route only: «Nueva / Editar mochila» lives in `components/backpacks/BackpackForm` (rule 4.7). */
export function BackpackEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = (useRoute().params ?? {}) as { id?: string; preset?: BackpackTemplate };

  // Adapts `beforeRemove` so the form can ask «¿Descartar los cambios?» before leaving (formularios.md §7).
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) => navigation.addListener("beforeRemove", (event) => handler(() => event.preventDefault())),
    [navigation],
  );

  return (
    <BackpackForm
      id={params.id}
      preset={params.preset}
      onClose={() => navigation.goBack()}
      onDeleted={() => navigation.popToTop()}
      onAddDocuments={(id) => navigation.navigate("BackpackAddDocuments", { id })}
      onOpenDocument={(doc) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title, backTitle: "Editar mochila" })}
      subscribeBeforeLeave={subscribeBeforeLeave}
    />
  );
}
