import { Button } from './Button.native';
import { Modal } from './Modal.native';
import { Typography } from './Typography.native';
import type { ConfirmModalProps } from './ConfirmModal.types';

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onPress={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant={confirmVariant} onPress={onConfirm} disabled={loading} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Typography variant="body" color="secondary">{message}</Typography>
    </Modal>
  );
}
