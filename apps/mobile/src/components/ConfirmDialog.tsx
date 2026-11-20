import type { ReactNode } from "react";
import { ConfirmModal } from "@helu/ui";

/**
 * Diálogo de confirmación de la app. Desde la v2 dibuja el `ConfirmModal` compartido
 * (@helu/ui): la opción segura va primero (`cancelText`, por ejemplo «Mantener cita») y la
 * acción usa el botón `danger` si es destructiva. Las props no cambiaron.
 */
interface ConfirmDialogProps {
  visible: boolean;
  icon?: ReactNode;
  title: string;
  message: string;
  cancelText?: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  icon,
  title,
  message,
  cancelText = "Cancelar",
  confirmText,
  onCancel,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  if (!visible) return null;
  return (
    <ConfirmModal
      title={title}
      message={message}
      icon={icon}
      iconTone={destructive ? "danger" : "primary"}
      keepLabel={cancelText}
      confirmLabel={confirmText}
      confirmVariant={destructive ? "danger" : "primary"}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
