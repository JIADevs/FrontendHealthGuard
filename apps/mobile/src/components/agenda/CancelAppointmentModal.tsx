import { XCircle } from "lucide-react-native";
import { ConfirmModal, useAppTheme } from "@helu/ui";

export interface CancelAppointmentModalProps {
  /** Title of the active or paused mission that is canceled with the appointment (RF-29) */
  missionTitle?: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * «¿Cancelar cita?» from the detail and from the card's «Más» sheet. Canceling keeps the appointment
 * in the history (≠ eliminar); when it has a live mission, «C5» says the mission goes too.
 */
export function CancelAppointmentModal({ missionTitle, loading, onConfirm, onCancel }: CancelAppointmentModalProps) {
  const t = useAppTheme();
  return missionTitle ? (
    <ConfirmModal
      title="¿Cancelar la cita?"
      message={`Quedará como cancelada y dejaremos de recordártela. Su misión «${missionTitle}» también se cancela.`}
      keepLabel="Mantener cita"
      confirmLabel="Cancelar cita y misión"
      confirmVariant="danger"
      // Mockup «C5»: red tile, centered copy and the two actions stacked («Mantener cita» first).
      icon={<XCircle size={24} strokeWidth={2.2} color={t.status.errorFg} />}
      iconTone="danger"
      actionsLayout="stacked"
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  ) : (
    <ConfirmModal
      title="¿Cancelar cita?"
      message="La cita queda cancelada en tu historial. No se borra."
      keepLabel="Mantener cita"
      confirmLabel="Cancelar cita"
      confirmVariant="danger"
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
