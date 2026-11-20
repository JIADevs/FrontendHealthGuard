import { Pressable, Text } from 'react-native';
import { nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { DangerLinkProps } from './DangerLink.types';

export function DangerLink({ label, icon, onPress, disabled = false }: DangerLinkProps) {
  const t = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        alignSelf: 'center',
        paddingHorizontal: 8,
        opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
      })}
    >
      {icon}
      <Text style={{ color: t.status.errorFg, fontSize: 14, fontFamily: nativeFont('heading', 800) }}>{label}</Text>
    </Pressable>
  );
}
