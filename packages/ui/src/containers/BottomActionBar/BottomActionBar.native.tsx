import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { Button } from '../../primitives/Button/Button.native';
import type { BottomActionBarProps } from './BottomActionBar.types';

export * from './BottomActionBar.types';

export function BottomActionBar({ primary, secondary }: BottomActionBarProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: Math.max(insets.bottom, spacing[3]),
        backgroundColor: t.surface.bgCard,
        borderTopWidth: 1,
        borderTopColor: t.border.default,
        gap: spacing[1],
      }}
    >
      {secondary ? (
        <Button variant="ghost" fullWidth onPress={secondary.onPress}>
          {secondary.label}
        </Button>
      ) : null}
      <Button
        variant={primary.variant ?? 'primary'}
        fullWidth
        onPress={primary.onPress}
        loading={primary.loading}
        loadingLabel={primary.loadingLabel}
        disabled={primary.disabled}
      >
        {primary.label}
      </Button>
    </View>
  );
}
