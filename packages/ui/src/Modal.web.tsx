"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { radii, spacing, fontSize, fontWeight } from './tokens';
import type { ModalProps, ModalSize } from './Modal.types';

const maxWidthBySize: Record<ModalSize, number> = {
  sm: 420,
  md: 600,
  lg: 800,
};

export function Modal({ title, onClose, children, size = 'md', footer }: ModalProps) {
  const [closeHover, setCloseHover] = useState(false);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-dark)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
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
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: radii.lg,
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: maxWidthBySize[size],
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
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
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: closeHover
                ? 'color-mix(in srgb, var(--text-primary) 14%, transparent)'
                : 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
              borderRadius: radii.sm,
              cursor: 'pointer',
              color: closeHover ? 'var(--text-primary)' : 'var(--text-secondary)',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
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
              borderTop: '1px solid var(--border)',
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
