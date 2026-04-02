"use client";

import { X } from 'lucide-react';
import { colors, radii, spacing, fontSize, fontWeight, surface, border } from './tokens';
import type { ModalProps, ModalSize } from './Modal.types';

const maxWidthBySize: Record<ModalSize, number> = {
  sm: 420,
  md: 600,
  lg: 800,
};

export function Modal({ title, onClose, children, size = 'md', footer }: ModalProps) {
  return (
    <div
      onClick={onClose}
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
          borderRadius: radii.lg,
          width: '100%',
          maxWidth: maxWidthBySize[size],
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: `${spacing[6]}px ${spacing[6]}px 0`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.extrabold,
              color: colors.gray[900],
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: colors.gray[100],
              borderRadius: radii.sm,
              cursor: 'pointer',
              color: colors.gray[500],
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: spacing[6], flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: `${spacing[4]}px ${spacing[6]}px`,
              borderTop: `1px solid ${border.default}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: spacing[2],
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
