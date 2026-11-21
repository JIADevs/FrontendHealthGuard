import { ConfirmModal } from '../../composed/ConfirmModal/ConfirmModal.native';
import type { DiscardChangesDialogProps } from './DiscardChangesDialog.types';

export function DiscardChangesDialog({ onKeep, onDiscard }: DiscardChangesDialogProps) {
  return (
    <ConfirmModal
      title="¿Descartar los cambios?"
      message="Si cierras ahora, se pierden los cambios que no guardaste."
      keepLabel="Seguir editando"
      confirmLabel="Descartar"
      confirmVariant="danger"
      onCancel={onKeep}
      onConfirm={onDiscard}
    />
  );
}
