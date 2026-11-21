import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useConfirmBounce } from '../../motion/motion.native';
import { Check } from 'lucide-react-native';
import { radii, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { toneColors } from '../../tokens/tones';
import type { ChipProps } from './Chip.types';
import { toneFromColor, OPTION_HEIGHT } from './chipStyle';

export function Chip({
  label,
  tone,
  color = 'default',
  variant = 'tag',
  icon,
  size = 'default',
  selected = false,
  selectionMode = 'multiple',
  onPress,
}: ChipProps) {
  const t = useAppTheme();
  // Chip de opción: al marcarse, rebote corto 0,95 → 1,04 → 1 (movimiento-interacciones.md §5).
  const bounce = useConfirmBounce(variant === 'option' && selected);
  const c = toneColors(tone ?? toneFromColor[color], t.mode);
  const isOption = variant === 'option';
  const compact = size === 'compact' && !isOption;

  const container = isOption
    ? {
        // Kit `.pick` (mockups): radio 12, borde de 1,5 px y canto inferior de 3 px.
        minHeight: OPTION_HEIGHT,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderBottomWidth: 4.5,
        borderColor: selected ? t.brand.focus : t.border.default,
        backgroundColor: selected ? t.brand.tint : t.surface.bgCard,
      }
    : {
        minHeight: compact ? 28 : undefined,
        paddingHorizontal: 10,
        paddingVertical: compact ? 0 : 5,
        borderRadius: radii.full,
        // Seleccionado (filtros v1): relleno con el color del tono y texto blanco
        backgroundColor: selected ? c.fg : c.bg,
      };

  const fg = isOption ? (selected ? t.brand.text : t.text.secondary) : selected ? t.text.onSolid : c.fg;

  const content = (
    <>
      {isOption && selected ? <Check size={14} strokeWidth={3} color={fg} /> : icon}
      <Text style={{ color: fg, fontSize: isOption ? 13 : 12.5, fontFamily: nativeFont('heading', 800) }}>{label}</Text>
    </>
  );

  const base = { ...container, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, alignSelf: 'flex-start' as const };

  if (onPress) {
    return (
      <Animated.View style={[{ alignSelf: 'flex-start' }, bounce]}>
        <Pressable
          style={({ pressed }) => [base, { opacity: pressed ? 0.8 : 1 }]}
          onPress={onPress}
          accessibilityRole={isOption ? (selectionMode === 'single' ? 'radio' : 'checkbox') : 'button'}
          accessibilityState={isOption ? { checked: selected } : { selected }}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }
  return <View style={base}>{content}</View>;
}
