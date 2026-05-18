"use client";
import { Button } from '../../primitives/Button/Button.web';
import { Modal } from '../../containers/Modal/Modal.web';
import { Typography } from '../../primitives/Typography/Typography.web';
import { palette, radii, spacing, fontSize, fontWeight, surface } from '../../tokens/tokens';
import type { ConfirmModalIconTone, ConfirmModalProps } from './ConfirmModal.types';

const ICON_TONE_BG: Record<ConfirmModalIconTone, string> = {
  danger:  palette.status.error[50],
  warning: palette.status.warning[50],
  primary: palette.brand[50],
  info:    palette.brand[50],
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  icon,
  iconTone = 'danger',
}: ConfirmModalProps) {
  if (icon) {
    return (
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: spacing[5],
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: surface.bgCard,
            borderRadius: radii.xl,
            width: '100%',
            maxWidth: 360,
            padding: `${spacing[6]}px ${spacing[6]}px ${spacing[5]}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.lg,
              background: ICON_TONE_BG[iconTone],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[4],
            }}
          >
            {icon}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.bold,
              color: palette.neutral[900],
              textAlign: 'center',
              marginBottom: spacing[2],
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: fontSize.sm,
              color: palette.neutral[500],
              textAlign: 'center',
              marginBottom: spacing[5],
            }}
          >
            {message}
          </p>
          <div style={{ display: 'flex', gap: spacing[3], width: '100%' }}>
            <div style={{ flex: 1 }}>
              <Button variant="secondary" fullWidth onPress={onCancel} disabled={loading}>
                Cancelar
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                variant={confirmVariant}
                fullWidth
                onPress={onConfirm}
                disabled={loading}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
