import { ActivityIndicator, View } from 'react-native';
import { colors, spacing } from '../../tokens/tokens';
import type { SpinnerProps, SpinnerSize, SpinnerColor } from './Spinner.types';

// ActivityIndicator solo acepta 'small' | 'large' como string; lg → large, el resto → small
const rnSize: Record<SpinnerSize, 'small' | 'large'> = { sm: 'small', md: 'small', lg: 'large' };

const rnColor: Record<SpinnerColor, string> = {
  primary: colors.sky[500],
  white:   colors.white,
};

export function Spinner({ size = 'md', color = 'primary', center = false }: SpinnerProps) {
  const indicator = (
    <ActivityIndicator size={rnSize[size]} color={rnColor[color]} />
  );

  if (center) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}>
        {indicator}
      </View>
    );
  }

  return indicator;
}
