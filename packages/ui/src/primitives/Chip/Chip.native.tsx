import { TouchableOpacity, Text, View } from 'react-native';
import { colors, palette, radii, fontSize, fontWeight } from '../../tokens/tokens';
import type { ChipProps, ChipColor } from './Chip.types';

const unselected: Record<ChipColor, { bg: string; text: string }> = {
  default: { bg: palette.brand[50],  text: palette.brand[700] },
  green:   { bg: palette.status.success[50],  text: palette.accent.document[700]   },
  amber:   { bg: palette.accent.medication[50],    text: palette.accent.medication[800]   },
};

const selectedPalette: Record<ChipColor, { bg: string; text: string }> = {
  default: { bg: palette.brand[500],   text: colors.white },
  green:   { bg: palette.accent.document[500], text: colors.white },
  amber:   { bg: palette.accent.medication[500], text: colors.white },
};

export function Chip({
  label,
  color = 'default',
  size = 'default',
  selected = false,
  onPress,
}: ChipProps) {
  const palette = selected ? selectedPalette[color] : unselected[color];
  const compact = size === 'compact';

  const containerStyle = {
    backgroundColor: palette.bg,
    paddingHorizontal: compact ? 10 : 10,
    paddingVertical: compact ? 0 : 3,
    minHeight: compact ? 28 : undefined,
    borderRadius: radii.full,
    alignSelf: 'flex-start' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  const textStyle = {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
    color: palette.text,
    lineHeight: compact ? 16 : undefined,
  };

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
