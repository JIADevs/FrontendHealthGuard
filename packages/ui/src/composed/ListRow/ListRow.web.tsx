"use client";
import { spacing, fontFamily } from '../../tokens/tokens';
import { IconTile } from '../../primitives/IconTile/IconTile.web';
import type { ListRowProps } from './ListRow.types';

const clamp2: React.CSSProperties = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

export function ListRow({ title, meta, icon, tone = 'neutral', trailing, onPress, accessibilityLabel }: ListRowProps) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: spacing[3], minHeight: 44, width: '100%',
    background: 'none', border: 'none', padding: 0, textAlign: 'left', font: 'inherit', color: 'inherit',
    cursor: onPress ? 'pointer' : 'default',
  };
  const body = (
    <>
      {icon ? <IconTile icon={icon} tone={tone} /> : null}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ ...clamp2, font: `600 14px/1.3 ${fontFamily.body}`, color: 'var(--color-text-primary)' }}>{title}</span>
        {meta ? <span style={{ ...clamp2, font: `400 13px/1.4 ${fontFamily.body}`, color: 'var(--color-text-secondary)' }}>{meta}</span> : null}
      </span>
      {trailing ? <span onClick={(e) => onPress && e.stopPropagation()}>{trailing}</span> : null}
    </>
  );
  if (onPress) {
    return (
      <button type="button" onClick={onPress} aria-label={accessibilityLabel} style={style}>
        {body}
      </button>
    );
  }
  return <div style={style}>{body}</div>;
}
