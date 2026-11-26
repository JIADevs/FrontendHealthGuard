/**
 * Swipe thresholds (movimiento-interacciones.md §4b). Shared by the native row and its tests;
 * no platform imports.
 */
export const SWIPE = {
  /** Width of each panel; the actions are «visible» at panels × this */
  panel: 96,
  /** Part of the panels that sits under the card's rounded corner */
  under: 20,
  /** Releasing past this share of the card applies the outer action */
  applyRatio: 0.6,
  /** …but never closer than this to the edge of the panels */
  applyGap: 24,
  /** Releasing faster than this (px/ms) away from the card opens it; it never applies */
  openVelocity: 0.5,
  /** A fling must still travel this far to open */
  flingMin: 16,
  /** Past this share of the card, the card moves at `rubber` of the finger's speed */
  rubberFrom: 0.9,
  rubber: 0.4,
  /** A side with no action: the card moves at a quarter of the finger, up to this */
  noActionMax: 24,
  noActionRatio: 0.25,
  /** Horizontal travel before the gesture starts, and vertical travel that hands it to the list */
  activeX: 10,
  failY: 12,
  /** Timings (ms) */
  close: 180,
  apply: 250,
  stretch: 150,
  /** Icon of the outer action while armed (the short bounce, movimiento.html «Acciones al deslizar») */
  bump: 1.18,
  longPress: 500,
  /** First-time discovery: the first card moves this far and back, after the list settles */
  peek: 44,
  peekDuration: 350,
  peekDelay: 450,
} as const;

/** Where releasing applies the outer action, for a card of `cardWidth` and panels of `panels` px. */
export function applyThreshold(cardWidth: number, panels: number): number {
  'worklet';
  return Math.max(cardWidth * SWIPE.applyRatio, panels + SWIPE.applyGap);
}

/** The card's offset for a finger offset of `dx`, with the resistance rules applied. */
export function resist(dx: number, panels: number, cardWidth: number): number {
  'worklet';
  const dir = dx < 0 ? -1 : 1;
  const a = Math.abs(dx);
  if (panels === 0) return dir * Math.min(a * SWIPE.noActionRatio, SWIPE.noActionMax);
  const lim = cardWidth * SWIPE.rubberFrom;
  return dir * (a > lim ? lim + (a - lim) * SWIPE.rubber : a);
}
