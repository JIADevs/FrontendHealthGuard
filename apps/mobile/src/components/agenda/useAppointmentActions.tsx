import { useCallback, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteAppointmentMutation, useUpdateAppointmentStatusMutation } from "@helu/api/hooks";
import { useMissionQuery, type Appointment } from "@helu/api";
import { ConfirmModal, formatApptDate } from "@helu/ui";
import { notify } from "../../lib/notify";
import { CancelAppointmentModal } from "./CancelAppointmentModal";

const showStatusError = () =>
  notify({ tone: "error", message: "No se pudo actualizar la cita", description: "Revisa tu conexión e intenta de nuevo." });

/**
 * What a list row can do with an appointment (#127): «Asistí» on release with «Deshacer», and
 * «Cancelar cita» / «Eliminar cita» behind their confirmation. Shared by the «Citas» cards and the
 * Calendar's day rows; render `dialogs` once on the screen.
 */
export function useAppointmentActions() {
  const qc = useQueryClient();
  const statusMut = useUpdateAppointmentStatusMutation();
  const deleteMut = useDeleteAppointmentMutation();
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  // Canceling also cancels a live mission (RF-29), and the dialog has to say so.
  const cancelMission = useMissionQuery(cancelTarget?.missionId ?? undefined).data;
  const cancelsMission = !!cancelMission && (cancelMission.status === "active" || cancelMission.status === "paused");

  /** Shows `status` on the cards at once; the server confirms in the background (movimiento §8). */
  const putStatus = useCallback(
    (a: Appointment, status: Appointment["status"]) => {
      const withStatus = (prev: { items: Appointment[] } | undefined) =>
        prev && Array.isArray(prev.items) ? { ...prev, items: prev.items.map((x) => (x.id === a.id ? { ...x, status } : x)) } : prev;
      void qc.cancelQueries({ queryKey: ["appointments"] });
      qc.setQueriesData<{ items: Appointment[] }>({ queryKey: ["appointments"] }, withStatus);
      return statusMut.mutateAsync({ id: a.id, status });
    },
    [qc, statusMut],
  );

  // «Asistí» from the swipe: low risk, so it applies on release with «Deshacer», like «Tomar».
  const markAttended = useCallback(
    (a: Appointment) => {
      const previous: Appointment["status"] = a.status || "PROGRAMADA";
      putStatus(a, "ASISTI").catch(() => {
        putStatus(a, previous).catch(() => undefined);
        showStatusError();
      });
      notify({
        message: "Asistencia registrada",
        action: { label: "Deshacer", onPress: () => void putStatus(a, previous).catch(showStatusError) },
      });
    },
    [putStatus],
  );

  const confirmCancel = () => {
    if (!cancelTarget) return;
    statusMut.mutate(
      { id: cancelTarget.id, status: "CANCELADA" },
      {
        onSuccess: () => {
          setCancelTarget(null);
          notify({ message: cancelsMission ? "Cita y misión canceladas" : "Cita cancelada" });
        },
        onError: () => showStatusError(),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        notify({ message: "Cita eliminada" });
      },
      // MASTER §8: what happened + what to do. The modal stays open, so «Eliminar» is the retry.
      onError: () => notify({ tone: "error", message: "No se pudo eliminar la cita", description: "Revisa tu conexión e intenta de nuevo." }),
    });
  };

  const dialogs: ReactNode = (
    <>
      {cancelTarget ? (
        <CancelAppointmentModal
          missionTitle={cancelsMission ? cancelMission!.title : undefined}
          loading={statusMut.isPending}
          onCancel={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        />
      ) : null}
      {deleteTarget ? (
        // MASTER §7: question + consequence; «Eliminar» borra la cita (≠ «Cancelar cita», que la conserva).
        <ConfirmModal
          title="¿Eliminar esta cita?"
          message={`Se borra la cita del ${formatApptDate(deleteTarget.date)} con sus recordatorios. No queda en tu historial y no se puede deshacer.`}
          keepLabel="Mantener cita"
          confirmLabel="Eliminar"
          icon={<Trash2 />}
          loading={deleteMut.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </>
  );

  return { markAttended, requestCancel: setCancelTarget, requestDelete: setDeleteTarget, dialogs };
}
