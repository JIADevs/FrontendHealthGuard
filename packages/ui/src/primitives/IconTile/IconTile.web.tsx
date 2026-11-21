"use client";
import { toneVars } from '../../tokens/tones';
import type { IconTileProps } from './IconTile.types';

export function IconTile({ icon, tone = 'neutral', size = 'md', round = false }: IconTileProps) {
  const c = toneVars(tone);
  const z = size === 'lg' ? 52 : 40;
  return (
    <div
      aria-hidden
      style={{ width: z, height: z, borderRadius: round ? '50%' : size === 'lg' ? 16 : 13, background: c.bg, color: c.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}
    >
      {icon}
    </div>
  );
}
