import { View } from 'react-native';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { toneColors } from '../../tokens/tones';
import type { IconTileProps } from './IconTile.types';

export function IconTile({ icon, tone = 'neutral', size = 'md', round = false }: IconTileProps) {
  const { mode } = useAppTheme();
  const c = toneColors(tone, mode);
  const z = size === 'lg' ? 52 : 40;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: z, height: z, borderRadius: round ? z / 2 : 13, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      {icon}
    </View>
  );
}

