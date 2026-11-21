import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { motion } from '../tokens/tokens';
import { useAppTheme } from '../tokens/ThemeProvider';

/**
 * Movimiento v2 en native (movimiento-interacciones.md). Todo corre con Reanimated en el hilo
 * de UI, es interrumpible y respeta el movimiento reducido del sistema.
 */

const bezier = (p: readonly [number, number, number, number]) => Easing.bezier(p[0], p[1], p[2], p[3]);
export const motionEasing = {
  out: bezier(motion.easeOut),
  in: bezier(motion.easeIn),
  standard: bezier(motion.easeStandard),
  spring: bezier(motion.easeSpring),
};

export { useReducedMotion };

/** Entrada de contenido que ya cargó: fundido de 150 ms (§6c «Cómo entra el contenido»). */
export const contentEntering = FadeIn.duration(motion.fast);

// ─── Fundido cruzado (fade through) ──────────────────────────────────────────

/**
 * *Fade through* (§2): el contenido anterior sale en 100 ms y **después** entra el nuevo
 * (150 ms; 250 ms subiendo 4 px si es una vista completa). Nunca hay dos contenidos encimados.
 * Si el valor cambia a mitad de camino, entra directo el último.
 */
export function useFadeThrough<T>(value: T, { fullView = false }: { fullView?: boolean } = {}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const latest = useRef(value);
  latest.current = value;
  const mounted = useRef(false);
  const opacity = useSharedValue(1);
  const offset = useSharedValue(0);

  const swap = () => setShown(latest.current);

  useEffect(() => {
    if (Object.is(value, shown)) return;
    if (reduced) {
      setShown(value);
      return;
    }
    cancelAnimation(opacity);
    opacity.value = withTiming(0, { duration: motion.instant, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(swap)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reduced) {
      opacity.value = withTiming(1, { duration: motion.fast });
      return;
    }
    const duration = fullView ? motion.base : motion.fast;
    offset.value = fullView ? 4 : 0;
    opacity.value = withTiming(1, { duration, easing: motionEasing.standard });
    offset.value = withTiming(0, { duration, easing: motionEasing.standard });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offset.value }],
  }));

  return { shown, style };
}

/** Componente del fundido cruzado: `<FadeThrough value={estado}>{(v) => …}</FadeThrough>`. */
export function FadeThrough<T>({
  value,
  fullView,
  style,
  children,
}: {
  value: T;
  fullView?: boolean;
  style?: StyleProp<ViewStyle>;
  children: (shown: T) => ReactNode;
}) {
  const { shown, style: animated } = useFadeThrough(value, { fullView });
  return <Animated.View style={[style, animated]}>{children(shown)}</Animated.View>;
}

// ─── Respuesta al toque de tarjetas y filas ──────────────────────────────────

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Tarjeta o fila tocable (§5): escala 0,98 + fondo de tinte en 100 ms, vuelve en 150 ms.
 * Con movimiento reducido solo cambia el tinte.
 */
export function PressableScale({ style, children, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : interpolate(pressed.value, [0, 1], [1, 0.98]) }],
  }));
  const tint = useAnimatedStyle(() => ({ opacity: pressed.value * 0.6 }));

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: motion.instant, easing: motionEasing.out });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: motion.fast, easing: motionEasing.out });
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, animated]}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18, backgroundColor: t.brand.tint },
            tint,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Rebote corto de confirmación ────────────────────────────────────────────

/** Rebote 0,95 → 1,04 → 1 en 250 ms (`ease-spring`) cuando `trigger` pasa a true (§5, chip de opción). */
export function useConfirmBounce(trigger: boolean) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!trigger || reduced) return;
    scale.value = withSequence(
      withTiming(0.95, { duration: 60, easing: motionEasing.out }),
      withTiming(1.04, { duration: 110, easing: motionEasing.spring }),
      withTiming(1, { duration: 80, easing: motionEasing.out }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

// ─── Resaltado «esto es nuevo» ───────────────────────────────────────────────

/** Borde azul que se desvanece en 1,2 s (§1b diccionario, §6 «Acción guardada»). */
export function useHighlight(active: boolean) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const level = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    level.value = 1;
    level.value = withTiming(0, { duration: reduced ? motion.fast : motion.highlight, easing: Easing.linear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return useAnimatedStyle(() => ({
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: t.brand.solid,
    opacity: level.value,
  }));
}

// ─── Esqueleto ───────────────────────────────────────────────────────────────

const ShimmerContext = createContext<SharedValue<number> | null>(null);

/**
 * Contenedor de esqueletos de una pantalla (§6c): un solo brillo para todos los bloques
 * (1,4 s, lineal, en bucle); quieto con movimiento reducido. Anuncia la carga.
 */
export function SkeletonGroup({
  label,
  style,
  children,
}: {
  /** Texto para el lector de pantalla, por ejemplo «Cargando citas». */
  label: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(withTiming(1, { duration: motion.shimmer, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(progress);
  }, [reduced, progress]);
  return (
    <ShimmerContext.Provider value={progress}>
      <View style={style} accessible accessibilityLabel={label} accessibilityState={{ busy: true }}>
        {children}
      </View>
    </ShimmerContext.Provider>
  );
}

/** Bloque del esqueleto: mismo tamaño y radio que el contenido real, color `border`. */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useAppTheme();
  const progress = useContext(ShimmerContext);
  const animated = useAnimatedStyle(() => ({
    opacity: progress ? interpolate(progress.value, [0, 0.5, 1], [1, 0.55, 1]) : 1,
  }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: t.border.default }, style, animated]}
    />
  );
}

/**
 * Esqueleto sin parpadeo (§6c): si llegó a mostrarse, se mantiene al menos 300 ms.
 * Devuelve `true` mientras hay que dibujar el esqueleto.
 */
export function useSkeletonVisible(loading: boolean, minimumMs = 300) {
  const [visible, setVisible] = useState(loading);
  const shownAt = useRef<number | null>(loading ? Date.now() : null);
  useEffect(() => {
    if (loading) {
      if (shownAt.current === null) shownAt.current = Date.now();
      setVisible(true);
      return;
    }
    if (shownAt.current === null) {
      setVisible(false);
      return;
    }
    const remaining = Math.max(0, minimumMs - (Date.now() - shownAt.current));
    const timer = setTimeout(() => {
      shownAt.current = null;
      setVisible(false);
    }, remaining);
    return () => clearTimeout(timer);
  }, [loading, minimumMs]);
  return visible;
}

/** Tarjeta de esqueleto del kit (radio 18, canto inferior) con líneas de 70 % y 45 %. */
export function SkeletonCard({
  tile = true,
  lines = 2,
  action = false,
  edge,
  style,
}: {
  tile?: boolean;
  lines?: number;
  /** Reserva el bloque de un botón a la derecha («Tomar», «Hacer»). */
  action?: boolean;
  /** Borde izquierdo de 6 px (filas del calendario), siempre en gris. */
  edge?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useAppTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderBottomWidth: 4,
          borderLeftWidth: edge ? 6 : 1,
          borderColor: t.border.default,
          backgroundColor: t.surface.bgCard,
        },
        style,
      ]}
    >
      {tile ? <Skeleton width={40} height={40} radius={13} /> : null}
      <View style={{ flex: 1, gap: 8 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? '70%' : '45%'} height={i === 0 ? 14 : 12} />
        ))}
      </View>
      {action ? <Skeleton width={84} height={44} radius={12} /> : null}
    </View>
  );
}
