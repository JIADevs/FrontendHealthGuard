"use client";

import { Button, Modal } from "@healthguard/ui";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel, loading, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onPress={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onPress={onConfirm} disabled={loading} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
}
