import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
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

export function Chip({ label, color = 'default', selected = false, onPress }: ChipProps) {
  const palette = selected ? selectedPalette[color] : unselected[color];

  const containerStyle = {
    backgroundColor: palette.bg,
    paddingHorizontal: 10 as const,
    paddingVertical: 3 as const,
    borderRadius: radii.full,
    alignSelf: 'flex-start' as const,
  };

  const textStyle = {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
    color: palette.text,
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
