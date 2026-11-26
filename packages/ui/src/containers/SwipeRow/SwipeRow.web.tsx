"use client";
import type { SwipeRowGroupProps, SwipeRowProps } from './SwipeRow.types';

/**
 * Web has no swipe with a mouse (movimiento-interacciones.md §4b «Web»): the card renders as is
 * and keeps its own «⋮» menu. Same contract as the native row so shared code can use it.
 */
export function SwipeRow({ children }: SwipeRowProps) {
  return <>{children}</>;
}

export function SwipeRowGroup({ children }: SwipeRowGroupProps) {
  return <>{children}</>;
}
