import { Pressable, Text, View } from 'react-native';
import { nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { SegmentedControlProps } from './SegmentedControl.types';

export function SegmentedControl({ options, value, onChange, accessibilityLabel }: SegmentedControlProps) {
  const t = useAppTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: t.surface.muted }}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
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
              backgroundColor: on ? t.surface.bgCard : 'transparent',
              borderBottomWidth: on ? 2 : 0,
              borderBottomColor: t.border.default,
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
