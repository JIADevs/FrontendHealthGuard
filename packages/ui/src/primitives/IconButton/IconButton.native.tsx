import { Pressable, Text, View } from 'react-native';
import { nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { IconButtonProps } from './IconButton.types';

const SIZE = 44;

export function IconButton({ icon, accessibilityLabel, tone = 'neutral', badge, disabled = false, onPress }: IconButtonProps) {
  const t = useAppTheme();
  const showBadge = badge === true || (typeof badge === 'number' && badge > 0);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={typeof badge === 'number' && badge > 0 ? `${accessibilityLabel}, ${badge}` : accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'tint' || pressed ? t.surface.muted : t.surface.bgCard,
        borderWidth: tone === 'neutral' ? 1.5 : 0,
        borderColor: t.border.default,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {icon}
      {showBadge ? (
        <View
          style={{
            position: 'absolute',
            top: typeof badge === 'number' ? 2 : 8,
            right: typeof badge === 'number' ? 2 : 9,
            minWidth: typeof badge === 'number' ? 18 : 10,
            height: typeof badge === 'number' ? 18 : 10,
            paddingHorizontal: typeof badge === 'number' ? 4 : 0,
            borderRadius: 9,
            backgroundColor: t.status.dangerSolid,
            borderWidth: 2,
            borderColor: t.surface.bgCard,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {typeof badge === 'number' ? (
            <Text style={{ color: t.text.onSolid, fontSize: 10, fontFamily: nativeFont('heading', 900) }}>
              {badge > 9 ? '9+' : badge}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
