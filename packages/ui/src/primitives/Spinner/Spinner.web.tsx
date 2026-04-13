"use client";
import { colors, palette, spacing } from '../../tokens/tokens';
import type { SpinnerProps, SpinnerSize, SpinnerColor } from './Spinner.types';

const sizePx: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 32 };

const trackColor: Record<SpinnerColor, string> = {
  primary: colors.gray[200],
  white:   'rgba(255,255,255,0.3)',
};

const fgColor: Record<SpinnerColor, string> = {
  primary: palette.brand[500],
  white:   colors.white,
};

const KEYFRAME = '@keyframes hg-spin{to{transform:rotate(360deg)}}';

export function Spinner({ size = 'md', color = 'primary', center = false }: SpinnerProps) {
  const px = sizePx[size];

  const spinner = (
    <>
      {/* React 19 deduplicates identical <style> elements automatically */}
      <style>{KEYFRAME}</style>
      <div
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          border: `2.5px solid ${trackColor[color]}`,
          borderTopColor: fgColor[color],
          animation: 'hg-spin 0.65s linear infinite',
          flexShrink: 0,
        }}
      />
    </>
  );

  if (center) {
    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
