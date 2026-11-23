import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  AccessibilityInfo,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { AlertCircle, ArrowDown, Check } from 'lucide-react-native';
import { motion, nativeFont } from '../tokens/tokens';
import { useAppTheme } from '../tokens/ThemeProvider';
import { Spinner } from '../primitives/Spinner/Spinner.native';

/**
 * Tirar para actualizar v2.12 (movimiento-interacciones.md · «Tirar para actualizar»).
 * El spinner nativo se oculta; en su lugar una píldora del kit dice qué pasa:
 * tirando → «Actualizado hace 3 min»; actualizando → `Spinner` + «Actualizando…»;
 * listo → «Actualizado ahora» (1 s, luego se desvanece); error → «No pudimos actualizar».
 * Solo el gesto muestra la píldora: las recargas en segundo plano no (§6c).
 */

export type PullRefreshPhase = 'idle' | 'refreshing' | 'done' | 'error';

/** How long «Actualizado ahora» stays before fading; errors stay longer so they can be read. */
const DONE_HOLD_MS = 1000;
const ERROR_HOLD_MS = 2500;
const PILL_HEIGHT = 34;
/** The pill fades in only once the pull has opened room for it, so it never sits on the content. */
const PULL_SHOW_FROM = PILL_HEIGHT + 4;
const PULL_VISIBLE = PILL_HEIGHT + 20;

function anyQueryFailed(result: unknown): boolean {
  const list = Array.isArray(result) ? result : [result];
  return list.some((r) => typeof r === 'object' && r !== null && 'isError' in r && (r as { isError: boolean }).isError);
}

export interface PullRefresh {
  /** Pull distance in px (0 when not pulled). */
  pull: SharedValue<number>;
  phase: PullRefreshPhase;
  /** Pass to the list's `onScroll`, with `scrollEventThrottle={16}`. Works on any RN list. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Pass to the list's `refreshControl`. */
  refreshControl: ReactElement;
  /** Last time the data arrived (ms), shown while pulling. */
  updatedAt: number | undefined;
}

/**
 * State for pull to refresh. `refetch` may return one TanStack Query result or an array of them;
 * any `isError` shows the error state. `updatedAt` is the query's `dataUpdatedAt` (the newest of
 * several, for screens that read more than one).
 */
export function usePullRefresh(refetch: () => Promise<unknown>, updatedAt: number | undefined): PullRefresh {
  const pull = useSharedValue(0);
  const [phase, setPhase] = useState<PullRefreshPhase>('idle');

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      pull.value = Math.max(0, -event.nativeEvent.contentOffset.y);
    },
    [pull],
  );

  const onRefresh = useCallback(() => {
    setPhase('refreshing');
    refetch()
      .then((result) => (anyQueryFailed(result) ? 'error' : 'done'))
      .catch(() => 'error' as const)
      .then((next) => setPhase(next));
  }, [refetch]);

  useEffect(() => {
    if (phase === 'refreshing') AccessibilityInfo.announceForAccessibility('Actualizando');
    if (phase === 'done') AccessibilityInfo.announceForAccessibility('Actualizado');
    if (phase === 'error') AccessibilityInfo.announceForAccessibility('No pudimos actualizar');
    if (phase !== 'done' && phase !== 'error') return;
    // The list keeps its refresh gap until the pill has faded, then content goes back up.
    const id = setTimeout(() => setPhase('idle'), (phase === 'done' ? DONE_HOLD_MS : ERROR_HOLD_MS) + motion.fast);
    return () => clearTimeout(id);
  }, [phase]);

  const refreshControl = (
    <RefreshControl
      refreshing={phase !== 'idle'}
      onRefresh={onRefresh}
      // The pill replaces the native spinner.
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
      style={Platform.OS === 'android' ? { backgroundColor: 'transparent' } : undefined}
    />
  );

  return { pull, phase, onScroll, refreshControl, updatedAt };
}

/** «Actualizado hace 3 min», «hace un momento», «hace 2 h», «ayer» or the date. */
export function formatUpdatedAgo(updatedAt: number | undefined, now: number): string {
  if (!updatedAt) return 'Desliza para actualizar';
  const minutes = Math.floor((now - updatedAt) / 60000);
  if (minutes < 1) return 'Actualizado hace un momento';
  if (minutes < 60) return `Actualizado hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Actualizado hace ${hours} h`;
  if (hours < 48) return 'Actualizado ayer';
  const date = new Date(updatedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  return `Actualizado el ${date}`;
}

export interface PullRefreshIndicatorProps {
  state: PullRefresh;
  /** Distance from the top of the list's container to the top of the list content (safe area, header). */
  top?: number;
}

/**
 * The pill. Render it as a sibling after the list, inside a container with the list's top edge:
 * it sits centered in the gap the pull opens.
 */
export function PullRefreshIndicator({ state, top = 0 }: PullRefreshIndicatorProps) {
  const t = useAppTheme();
  const { pull, phase, updatedAt } = state;
  const [now, setNow] = useState(() => Date.now());

  // After «Actualizado ahora» fades, the pill stays hidden while the content goes back up;
  // a new pull shows it again.
  const fade = useSharedValue(1);
  useEffect(() => {
    if (phase === 'done' || phase === 'error') {
      fade.value = 1;
      fade.value = withDelay(phase === 'done' ? DONE_HOLD_MS : ERROR_HOLD_MS, withTiming(0, { duration: motion.fast }));
    } else if (phase === 'refreshing') {
      fade.value = 1;
    }
  }, [phase, fade]);

  // Each new pull: show the pill again and refresh «hace N min».
  useAnimatedReaction(
    () => pull.value > 1,
    (pulling, wasPulling) => {
      if (pulling && !wasPulling) {
        fade.value = 1;
        runOnJS(setNow)(Date.now());
      }
    },
  );

  const active = phase !== 'idle';
  const style = useAnimatedStyle(() => {
    const shown = active ? 1 : interpolate(pull.value, [PULL_SHOW_FROM, PULL_VISIBLE], [0, 1], 'clamp');
    return {
      opacity: shown * fade.value,
      transform: [{ translateY: Math.max(0, (pull.value - PILL_HEIGHT) / 2) }],
    };
  });

  const ink = phase === 'error' ? t.status.errorFg : t.text.secondary;
  const icon =
    phase === 'refreshing' ? (
      <Spinner size="sm" />
    ) : phase === 'done' ? (
      <Check size={15} strokeWidth={3} color={t.status.successGraphic} />
    ) : phase === 'error' ? (
      <AlertCircle size={15} strokeWidth={2.6} color={t.status.errorFg} />
    ) : (
      <ArrowDown size={15} strokeWidth={2.6} color={t.text.secondary} />
    );
  const label =
    phase === 'refreshing'
      ? 'Actualizando…'
      : phase === 'done'
        ? 'Actualizado ahora'
        : phase === 'error'
          ? 'No pudimos actualizar'
          : formatUpdatedAgo(updatedAt, now);

  return (
    <View pointerEvents="none" style={[styles.slot, { top }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: t.surface.bgCard, borderColor: t.border.default },
          style,
        ]}
      >
        {icon}
        <Text style={[styles.label, { color: ink }]}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  pill: {
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 11,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  label: {
    fontSize: 12.5,
    fontFamily: nativeFont('heading', 700),
  },
});
