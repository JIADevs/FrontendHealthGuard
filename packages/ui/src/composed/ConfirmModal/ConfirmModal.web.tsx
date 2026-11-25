"use client";
import { Button } from '../../primitives/Button/Button.web';
import { Modal } from '../../containers/Modal/Modal.web';
import { Typography } from '../../primitives/Typography/Typography.web';
import { IconTile } from '../../primitives/IconTile/IconTile.web';
import { radii, spacing, fontSize, fontFamily } from '../../tokens/tokens';
import type { Tone } from '../../tokens/tones';
import type { ConfirmModalIconTone, ConfirmModalProps } from './ConfirmModal.types';

const ICON_TONE: Record<ConfirmModalIconTone, Tone> = {
  danger:  'danger',
  warning: 'warning',
  primary: 'brand',
  info:    'info',
  neutral: 'neutral',
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  keepLabel = 'Cancelar',
  keepVariant = 'secondary',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  icon,
  iconTone = 'danger',
  actionsLayout = 'row',
}: ConfirmModalProps) {
  const stacked = actionsLayout === 'stacked';
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
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: radii.modal,
            width: '100%',
            maxWidth: 360,
            padding: `${spacing[6]}px ${spacing[6]}px ${spacing[5]}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ marginBottom: spacing[4] }}>
            <IconTile icon={icon} tone={ICON_TONE[iconTone]} size="lg" round />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: fontSize.lg,
              fontFamily: fontFamily.heading,
              fontWeight: 900,
              color: 'var(--color-text-primary)',
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
              fontFamily: fontFamily.body,
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              marginBottom: spacing[5],
            }}
          >
            {message}
          </p>
          <div style={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', gap: spacing[3], width: '100%' }}>
            <div style={{ flex: 1 }}>
              <Button variant={keepVariant} fullWidth onPress={onCancel} disabled={loading}>
                {keepLabel}
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
            flexDirection: stacked ? 'column' : 'row',
            alignItems: stacked ? 'stretch' : 'center',
            justifyContent: 'flex-end',
            flexWrap: 'nowrap',
            gap: 8,
            width: '100%',
          }}
        >
          <Button variant={keepVariant} fullWidth={stacked} onPress={onCancel} disabled={loading}>
            {keepLabel}
          </Button>
          <Button variant={confirmVariant} fullWidth={stacked} onPress={onConfirm} disabled={loading} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <Typography variant="body" color="secondary">{message}</Typography>
    </Modal>
  );
}
