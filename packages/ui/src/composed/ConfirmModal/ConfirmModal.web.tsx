"use client";
import { Button } from '../../primitives/Button/Button.web';
import { Modal } from '../../containers/Modal/Modal.web';
import { Typography } from '../../primitives/Typography/Typography.web';
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'nowrap',
            gap: 8,
            width: '100%',
          }}
        >
          <Button variant="secondary" onPress={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onPress={onConfirm} disabled={loading} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <Typography variant="body" color="secondary">{message}</Typography>
    </Modal>
  );
}
