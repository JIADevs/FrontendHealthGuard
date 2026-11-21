import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { motionEasing } from '../../motion/motion.native';
import type { SegmentedControlProps } from './SegmentedControl.types';

type Slot = { x: number; width: number };

/**
 * Control segmentado (kit `.seg`). El indicador blanco se desliza a la opción elegida en 250 ms
 * con `ease-standard` (movimiento-interacciones.md §5); con movimiento reducido salta directo.
 * El indicador es absoluto: animar su ancho no mueve el resto del layout.
 */
export function SegmentedControl({ options, value, onChange, accessibilityLabel }: SegmentedControlProps) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    const slot = slots[value];
    if (!slot) return;
    if (!placed.current || reduced) {
      x.value = slot.x;
      width.value = slot.width;
      placed.current = true;
      return;
    }
    const config = { duration: motion.base, easing: motionEasing.standard };
    x.value = withTiming(slot.x, config);
    width.value = withTiming(slot.width, config);
  }, [value, slots, reduced, x, width]);

  const indicator = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ translateX: x.value }],
    opacity: width.value > 0 ? 1 : 0,
  }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: t.surface.muted }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 0,
            borderRadius: 11,
            backgroundColor: t.surface.bgCard,
            borderBottomWidth: 2,
            borderBottomColor: t.border.default,
          },
          indicator,
        ]}
      />
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            onLayout={(event) => {
              const { x: ox, width: ow } = event.nativeEvent.layout;
              setSlots((prev) =>
                prev[option.value]?.x === ox && prev[option.value]?.width === ow
                  ? prev
                  : { ...prev, [option.value]: { x: ox, width: ow } },
              );
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={{
              // Crece desde el ancho de su texto: con 4 opciones («Medicamentos») el reparto igual las cortaba.
              flexGrow: 1,
              flexBasis: 'auto',
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingHorizontal: 6,
              borderRadius: 11,
            }}
          >
            {option.icon}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={{ fontSize: 13, fontFamily: nativeFont('heading', 800), color: on ? t.brand.text : t.text.onMuted }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
