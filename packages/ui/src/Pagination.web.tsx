"use client";
import { colors, radii, spacing, fontSize, fontWeight } from './tokens';
import type { PaginationProps } from './Pagination.types';

const PAGE_WINDOW = 5;

function getPages(page: number, totalPages: number): number[] {
  const half = Math.floor(PAGE_WINDOW / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + PAGE_WINDOW - 1);
  start = Math.max(1, end - PAGE_WINDOW + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPages(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const baseBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    height: 32,
    padding: `0 ${spacing[2]}px`,
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: radii.sm,
    background: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  };

  const activeBtn: React.CSSProperties = {
    ...baseBtn,
    background: colors.sky[500],
    borderColor: colors.sky[500],
    color: colors.white,
    fontWeight: fontWeight.semibold,
    cursor: 'default',
  };

  const disabledBtn: React.CSSProperties = {
    ...baseBtn,
    opacity: 0.4,
    cursor: 'not-allowed',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], flexWrap: 'wrap' }}>
      <button
        style={canPrev ? baseBtn : disabledBtn}
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          style={p === page ? activeBtn : baseBtn}
          onClick={() => p !== page && onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      <button
        style={canNext ? baseBtn : disabledBtn}
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </div>
  );
}
