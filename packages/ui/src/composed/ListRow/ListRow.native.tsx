import { Pressable, Text, View } from 'react-native';
import { spacing, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { IconTile } from '../../primitives/IconTile/IconTile.native';
import type { ListRowProps } from './ListRow.types';

export function ListRow({ title, meta, icon, tone = 'neutral', trailing, onPress, accessibilityLabel }: ListRowProps) {
  const t = useAppTheme();
  const body = (
    <>
      {icon ? <IconTile icon={icon} tone={tone} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} style={{ fontSize: 14, lineHeight: 18, fontFamily: nativeFont('body', 600), color: t.text.primary }}>
          {title}
        </Text>
        {meta ? (
          <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, fontFamily: nativeFont('body', 400), color: t.text.secondary, marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );
  const row = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing[3], minHeight: 44 };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (meta ? `${title}, ${meta}` : title)}
        style={({ pressed }) => [row, { opacity: pressed ? 0.7 : 1 }]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={row}>{body}</View>;
}
