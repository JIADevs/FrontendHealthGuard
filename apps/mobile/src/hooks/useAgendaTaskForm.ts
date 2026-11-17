import { useAgendaTaskFormCore } from "@helu/api/hooks";
import Toast from "react-native-toast-message";
import type { AgendaTask } from "@helu/api";

export function useAgendaTaskForm({
  initial,
  onClose,
}: {
  initial?: AgendaTask | null;
  onClose: () => void;
}) {
  return useAgendaTaskFormCore({
    initial,
    adapters: {
      onSaveSuccess: () =>
        Toast.show({
          type: "success",
          text1: initial ? "Tarea actualizada" : "Tarea creada",
        }),
      afterSave: onClose,
    },
  });
}
