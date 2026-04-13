import { View } from 'react-native';
import { spacing } from '../../tokens/tokens';
import type { CardGridProps } from './CardGrid.types';

/** Use as `contentContainerStyle` in FlatList */
export const cardContentStyle = {
  padding: spacing[4],
  gap: spacing[3],
  paddingBottom: spacing[8],
} as const;

export function CardGrid({ children }: CardGridProps) {
  return (
    <View style={{ padding: spacing[4], gap: spacing[3] }}>
      {children}
    </View>
  );
}
