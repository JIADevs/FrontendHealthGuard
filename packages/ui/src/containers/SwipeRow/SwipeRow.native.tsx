import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type AccessibilityActionEvent, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, useCompetingGestures, useLongPressGesture, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { ThemeContextValue } from '../../tokens/ThemeProvider';
import { motionEasing } from '../../motion/motion.native';
import { SWIPE, applyThreshold, resist } from './swipe';
import { useSwipeRowGroup } from './SwipeRowGroup.native';
import type { SwipeAction, SwipeActionTone, SwipeHaptic, SwipeRowProps } from './SwipeRow.types';

const panelBg = (t: ThemeContextValue): Record<SwipeActionTone, string> => ({
  more: colors.slate[500],
  primary: t.brand.solid,
  positive: t.status.successSolid,
});

/**
 * List card with swipe actions (MASTER §7, movimiento-interacciones.md §4b). The card follows the
 * finger 1:1; the panels grow under it. Past the panels' width a selection haptic says the
 * actions are visible; past 60 % of the card a medium impact says releasing applies the outer
 * action, which stretches over «Más». Velocity only opens, never applies.
 */
export function SwipeRow({ id, children, endActions = [], startAction, onLongPress, onHaptic }: SwipeRowProps) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const group = useSwipeRowGroup();
  const bg = panelBg(t);

  const endW = endActions.length * SWIPE.panel;
  const startW = startAction ? SWIPE.panel : 0;

  const x = useSharedValue(0);
  const from = useSharedValue(0);
  const width = useSharedValue(0);
  const revealed = useSharedValue(false);
  const armed = useSharedValue(false);
  const stretch = useSharedValue(0); // 0 → «Más» visible, 1 → the outer action covers it
  const [open, setOpen] = useState(false);

  const dur = useCallback((ms: number) => (reduced ? 0 : ms), [reduced]);

  const close = useCallback(() => {
    x.value = withTiming(0, { duration: dur(SWIPE.close), easing: motionEasing.out });
    stretch.value = withTiming(0, { duration: dur(SWIPE.stretch) });
    revealed.value = false;
    armed.value = false;
    setOpen(false);
  }, [armed, dur, revealed, stretch, x]);

  // Register with the group so opening another row (or scrolling) closes this one.
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => group?.register(id, () => closeRef.current()), [group, id]);

  const haptic = useCallback((k: SwipeHaptic) => onHaptic?.(k), [onHaptic]);
  const didOpen = useCallback(() => {
    setOpen(true);
    group?.opened(id);
  }, [group, id]);
  const willStart = useCallback(() => {
    group?.opened(id);
  }, [group, id]);

  /** Runs the outer action of a side (−1 = end, 1 = start) after the card is back. */
  const apply = useCallback(
    (dir: number) => {
      const action = dir < 0 ? endActions[endActions.length - 1] : startAction;
      close();
      if (action) setTimeout(action.onPress, dur(SWIPE.apply));
    },
    [close, dur, endActions, startAction],
  );

  const pan = usePanGesture({
    activeOffsetX: [-SWIPE.activeX, SWIPE.activeX],
    failOffsetY: [-SWIPE.failY, SWIPE.failY],
    onActivate: () => {
      'worklet';
      from.value = x.value;
      runOnJS(willStart)();
    },
    onUpdate: (e) => {
      'worklet';
      const dx = from.value + e.translationX;
      const dir = dx < 0 ? -1 : 1;
      const panels = dir < 0 ? endW : startW;
      const nx = resist(dx, panels, width.value);
      x.value = nx;
      if (panels === 0) return;
      const a = Math.abs(nx);
      const rev = a >= panels;
      const arm = a >= applyThreshold(width.value, panels);
      if (rev && !revealed.value && !arm) runOnJS(haptic)('reveal');
      if (arm && !armed.value) runOnJS(haptic)('arm');
      if (!arm && armed.value) runOnJS(haptic)('disarm');
      revealed.value = rev;
      if (arm !== armed.value) stretch.value = withTiming(arm ? 1 : 0, { duration: reduced ? 0 : SWIPE.stretch });
      armed.value = arm;
    },
    onDeactivate: (e) => {
      'worklet';
      const dir = x.value < 0 ? -1 : 1;
      const panels = dir < 0 ? endW : startW;
      const a = Math.abs(x.value);
      const v = (e.velocityX / 1000) * dir; // px/ms away from the card
      if (panels > 0 && armed.value) {
        runOnJS(apply)(dir);
        return;
      }
      if (panels > 0 && (a >= panels / 2 || (v > SWIPE.openVelocity && a > SWIPE.flingMin))) {
        x.value = reduced ? dir * panels : withSpring(dir * panels, motion.sheetSpring);
        revealed.value = true;
        runOnJS(didOpen)();
        return;
      }
      runOnJS(close)();
    },
  });

  const hold = useLongPressGesture({
    minDuration: SWIPE.longPress,
    enabled: !!onLongPress,
    onActivate: () => {
      'worklet';
      if (onLongPress) {
        runOnJS(haptic)('longPress');
        runOnJS(onLongPress)();
      }
    },
  });

  const gesture = useCompetingGestures(pan, hold);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const endBox = useAnimatedStyle(() => ({ width: x.value < 0 ? -x.value + SWIPE.under : 0 }));
  const startBox = useAnimatedStyle(() => ({ width: x.value > 0 ? x.value + SWIPE.under : 0 }));
  const moreGrow = useAnimatedStyle(() => ({ flexGrow: 1 - stretch.value }));

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
  };

  // VoiceOver / TalkBack: the same actions without the gesture.
  const a11yActions = useMemo(
    () => [...[...endActions].reverse(), ...(startAction ? [startAction] : [])].map((a) => ({ name: a.key, label: a.label })),
    [endActions, startAction],
  );
  const onA11y = (e: AccessibilityActionEvent) => {
    const all: SwipeAction[] = [...endActions, ...(startAction ? [startAction] : [])];
    all.find((a) => a.key === e.nativeEvent.actionName)?.onPress();
  };

  const panel = (a: SwipeAction, side: 'end' | 'start', outer: boolean, first: boolean) => {
    const content = (
      <Pressable
        onPress={() => (outer ? apply(side === 'end' ? -1 : 1) : (close(), a.onPress()))}
        accessibilityRole="button"
        accessibilityLabel={a.label}
        style={[styles.panel, { backgroundColor: bg[a.tone] }, first && (side === 'end' ? styles.padStart : styles.padEnd)]}
      >
        {a.icon}
        <Text numberOfLines={1} style={[styles.label, { color: t.text.onSolid }]}>{a.label}</Text>
      </Pressable>
    );
    return outer ? (
      <View key={a.key} style={styles.grow}>{content}</View>
    ) : (
      <Animated.View key={a.key} style={[styles.grow, moreGrow]}>{content}</Animated.View>
    );
  };

  return (
    <View onLayout={onLayout}>
      {endActions.length > 0 ? (
        <Animated.View style={[styles.box, styles.end, endBox]} importantForAccessibility="no-hide-descendants">
          {endActions.map((a, i) => panel(a, 'end', i === endActions.length - 1, i === 0))}
        </Animated.View>
      ) : null}
      {startAction ? (
        <Animated.View style={[styles.box, styles.start, startBox]} importantForAccessibility="no-hide-descendants">
          {panel(startAction, 'start', true, true)}
        </Animated.View>
      ) : null}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[styles.card, cardStyle]}
          accessibilityActions={a11yActions}
          onAccessibilityAction={onA11y}
        >
          {children}
          {/* While open, a tap on the card closes it instead of opening the detail. */}
          {open ? <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Cerrar acciones" /> : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { zIndex: 1 },
  // Panels sit behind the card, above its 3 px edge, and grow with the swipe.
  box: { position: 'absolute', top: 0, bottom: 3, flexDirection: 'row', overflow: 'hidden' },
  end: { right: 0, borderTopRightRadius: 18, borderBottomRightRadius: 18 },
  start: { left: 0, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  grow: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  panel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  padStart: { paddingLeft: SWIPE.under },
  padEnd: { paddingRight: SWIPE.under },
  label: { fontSize: 12.5, fontFamily: nativeFont('heading', 800) },
});
