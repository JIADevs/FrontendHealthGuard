/**
 * AnimatedLoginBackground — Burbujas flotantes + olas fluidas para Login/Signup.
 *
 * Optimizado:
 * - Un solo requestAnimationFrame para TODAS las burbujas (en vez de 8 independientes)
 * - Olas throttleadas a ~30fps (en vez de 60)
 */
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions, AppState } from "react-native";
import Svg, { Path } from "react-native-svg";
import { palette } from "@helu/ui";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Bubble Config ───────────────────────────────────────────────────────────

interface BubbleConfig {
  size: number;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  color: string;
  opacity: number;
}

const BUBBLES: BubbleConfig[] = [
  { size: 250, startX: 20, startY: 40, vx: 0.3, vy: 0.2, color: palette.brand[100], opacity: 0.55 },
  { size: 100, startX: SCREEN_WIDTH - 130, startY: 80, vx: -0.25, vy: 0.35, color: palette.brand[200], opacity: 0.5 },
  { size: 25, startX: 60, startY: SCREEN_HEIGHT * 0.35, vx: 0.4, vy: -0.2, color: palette.brand[100], opacity: 0.5 },
  { size: 175, startX: SCREEN_WIDTH * 0.5, startY: SCREEN_HEIGHT * 0.2, vx: -0.35, vy: 0.3, color: palette.brand[200], opacity: 0.52 },
  { size: 30, startX: SCREEN_WIDTH - 100, startY: SCREEN_HEIGHT * 0.5, vx: 0.2, vy: -0.3, color: palette.brand[100], opacity: 0.58 },
  { size: 12, startX: 40, startY: SCREEN_HEIGHT * 0.65, vx: 0.35, vy: 0.15, color: palette.brand[200], opacity: 0.55 },
  { size: 38, startX: SCREEN_WIDTH * 0.65, startY: SCREEN_HEIGHT * 0.15, vx: -0.2, vy: 0.4, color: palette.brand[100], opacity: 0.5 },
  { size: 750, startX: SCREEN_WIDTH * 0.25, startY: SCREEN_HEIGHT * 0.75, vx: -0.15, vy: -0.25, color: palette.brand[50], opacity: 0.5 },
];

// ─── Physics state (mutable, shared across all bubbles) ─────────────────────

interface BubbleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  animX: Animated.Value;
  animY: Animated.Value;
}

function initBubbleStates(): BubbleState[] {
  return BUBBLES.map((config) => ({
    x: 0,
    y: 0,
    vx: config.vx,
    vy: config.vy,
    minX: -config.size * 0.4 - config.startX,
    maxX: SCREEN_WIDTH - config.size * 0.6 - config.startX,
    minY: -config.size * 0.4 - config.startY,
    maxY: SCREEN_HEIGHT - config.size * 0.6 - config.startY,
    animX: new Animated.Value(0),
    animY: new Animated.Value(0),
  }));
}

// ─── Unified Bubble Engine (1 rAF for all bubbles) ──────────────────────────

function BubbleLayer() {
  const statesRef = useRef<BubbleState[]>(initBubbleStates());

  useEffect(() => {
    let frameId: number;
    const states = statesRef.current;
    const isActive = { current: AppState.currentState === "active" };

    const sub = AppState.addEventListener("change", (s) => {
      isActive.current = s === "active";
    });

    const tick = () => {
      if (isActive.current) {
        for (let i = 0; i < states.length; i++) {
          const s = states[i];
          s.x += s.vx;
          s.y += s.vy;

          if (s.x <= s.minX || s.x >= s.maxX) {
            s.vx *= -1;
            s.x = Math.max(s.minX, Math.min(s.maxX, s.x));
          }
          if (s.y <= s.minY || s.y >= s.maxY) {
            s.vy *= -1;
            s.y = Math.max(s.minY, Math.min(s.maxY, s.y));
          }

          s.animX.setValue(s.x);
          s.animY.setValue(s.y);
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      sub.remove();
    };
  }, []);

  return (
    <>
      {BUBBLES.map((config, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bubble,
            {
              width: config.size,
              height: config.size,
              borderRadius: config.size / 2,
              left: config.startX,
              top: config.startY,
              backgroundColor: config.color,
              opacity: config.opacity,
              transform: [
                { translateX: statesRef.current[i].animX },
                { translateY: statesRef.current[i].animY },
              ],
            },
          ]}
        />
      ))}
    </>
  );
}

// ─── Fluid Waves (throttled to ~30fps) ───────────────────────────────────────

const WAVE_HEIGHT = 160;
const WAVE_POINTS = 40;
const WAVE_FRAME_MS = 33; // ~30fps throttle

function generateFluidPath(
  time: number,
  baseY: number,
  amplitude: number,
  speed: number,
  phase: number,
): string {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= WAVE_POINTS; i++) {
    const normalizedX = i / WAVE_POINTS;
    const x = normalizedX * SCREEN_WIDTH;

    const y =
      baseY +
      Math.sin(normalizedX * Math.PI * 2 + time * speed + phase) * amplitude +
      Math.sin(normalizedX * Math.PI * 1.5 + time * speed * 0.6 + phase * 1.4) * (amplitude * 0.3);

    points.push({ x, y });
  }

  let d = `M-5,${WAVE_HEIGHT} L${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x},${points[i].y}`;
  }
  d += ` L${SCREEN_WIDTH + 5},${WAVE_HEIGHT} Z`;
  return d;
}

interface WaveLayerConfig {
  baseY: number;
  amplitude: number;
  speed: number;
  phase: number;
  fill: string;
  opacity: number;
}

const WAVE_LAYERS: WaveLayerConfig[] = [
  { baseY: WAVE_HEIGHT * 0.35, amplitude: 14, speed: 0.3, phase: 0, fill: palette.brand[100], opacity: 0.35 },
  { baseY: WAVE_HEIGHT * 0.5, amplitude: 10, speed: 0.3, phase: 2.1, fill: palette.brand[200], opacity: 0.45 },
  { baseY: WAVE_HEIGHT * 0.65, amplitude: 8, speed: 0.3, phase: 4.2, fill: palette.brand[300], opacity: 0.6 },
];

function FluidWaves() {
  const [paths, setPaths] = React.useState<string[]>(() =>
    WAVE_LAYERS.map((l) => generateFluidPath(0, l.baseY, l.amplitude, l.speed, l.phase))
  );

  useEffect(() => {
    let frameId: number;
    let elapsedTime = 0;
    let lastTime = Date.now();
    let lastUpdate = 0;
    const isActive = { current: AppState.currentState === "active" };

    const sub = AppState.addEventListener("change", (s) => {
      isActive.current = s === "active";
      if (s === "active") {
        lastTime = Date.now(); // reset so we don't accumulate pause time
      }
    });

    const tick = () => {
      const now = Date.now();

      if (isActive.current) {
        const delta = now - lastTime;
        elapsedTime += delta / 1000;

        if (now - lastUpdate >= WAVE_FRAME_MS) {
          lastUpdate = now;
          const newPaths = WAVE_LAYERS.map((layer) =>
            generateFluidPath(elapsedTime, layer.baseY, layer.amplitude, layer.speed, layer.phase)
          );
          setPaths(newPaths);
        }
      }

      lastTime = now;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.waveContainer}>
      <Svg width={SCREEN_WIDTH} height={WAVE_HEIGHT}>
        {WAVE_LAYERS.map((layer, i) => (
          <Path key={i} d={paths[i]} fill={layer.fill} opacity={layer.opacity} />
        ))}
      </Svg>
    </View>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AnimatedLoginBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <BubbleLayer />
      <FluidWaves />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: WAVE_HEIGHT,
  },
});
