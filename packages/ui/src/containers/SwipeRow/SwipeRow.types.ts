import type { ReactNode } from 'react';

/**
 * Color of a swipe panel (MASTER §7 «Acciones al deslizar»):
 * - `more`: «Más», slate.
 * - `primary`: the card's main action, at the outer edge, brand.
 * - `positive`: the one action on the other side («Tomar», «Asistí»), success.
 */
export type SwipeActionTone = 'more' | 'primary' | 'positive';

export interface SwipeAction {
  /** Stable key; also the VoiceOver action name */
  key: string;
  label: string;
  /** Icon drawn in white, 22 px (lucide) */
  icon: ReactNode;
  tone: SwipeActionTone;
  onPress: () => void;
}

/**
 * Haptic moments of the gesture (movimiento-interacciones.md §4b):
 * - `reveal`: the actions are fully visible (selection).
 * - `arm`: releasing now applies the outer action (medium impact).
 * - `disarm`: the finger went back below the apply threshold (selection).
 * - `longPress`: the card was held for 500 ms and «Más» opens.
 */
export type SwipeHaptic = 'reveal' | 'arm' | 'disarm' | 'longPress';

/**
 * Mobile list card whose actions show when it is swiped (#127). Swipe left reveals `endActions`
 * («Más» first, the main action last, at the edge); swipe right reveals `startAction`. Swiping
 * past 60 % of the card applies the outer action. Destructive actions never go here: they live
 * in the «Más» sheet. Web renders only the card and keeps its own «⋮» menu.
 */
export interface SwipeRowProps {
  /** Unique within its `SwipeRowGroup`, so only one row stays open */
  id: string;
  children: ReactNode;
  /** Revealed by swiping left: «Más» and the main action, in that order */
  endActions?: SwipeAction[];
  /** Revealed by swiping right: at most one positive action */
  startAction?: SwipeAction;
  /** Holding the card for 500 ms; opens the «Más» sheet */
  onLongPress?: () => void;
  /** Mobile only: lets the app play `expo-haptics` without @helu/ui depending on it */
  onHaptic?: (kind: SwipeHaptic) => void;
}

/** Keeps a single row open and closes it when the list scrolls. */
export interface SwipeRowGroupProps {
  children: ReactNode;
}

export interface SwipeRowGroupHandle {
  /** Closes the open row, if any (call it from `onScrollBeginDrag`) */
  closeAll: () => void;
}
