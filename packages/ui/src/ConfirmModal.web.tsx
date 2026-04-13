"use client";
import { Button } from './Button.web';
import { Modal } from './Modal.web';
import { Typography } from './Typography.web';
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
      size="sm"
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
