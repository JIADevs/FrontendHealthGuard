"use client";
import { spacing } from '../../tokens/tokens';
import { Button } from '../../primitives/Button/Button.web';
import type { BottomActionBarProps } from './BottomActionBar.types';

export * from './BottomActionBar.types';

/** Web: pie fijo de página (pages/web.md §2, por ejemplo Perfil). Usa `position: sticky`. */
export function BottomActionBar({ primary, secondary }: BottomActionBarProps) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: spacing[3],
        padding: `${spacing[3]}px ${spacing[4]}px`,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        zIndex: 2,
      }}
    >
      {secondary ? (
        <Button variant="ghost" onPress={secondary.onPress}>
          {secondary.label}
        </Button>
      ) : null}
      <Button
        variant={primary.variant ?? 'primary'}
        onPress={primary.onPress}
        loading={primary.loading}
        loadingLabel={primary.loadingLabel}
        disabled={primary.disabled}
      >
        {primary.label}
      </Button>
    </div>
  );
}
