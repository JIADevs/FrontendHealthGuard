import { cloneElement, isValidElement, useRef, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BottomSheet } from '../../containers/BottomSheet/BottomSheet.native';
import type { BottomSheetHandle } from '../../containers/BottomSheet/BottomSheet.types';
import { IconTile } from '../../primitives/IconTile/IconTile.native';
import { ListRow } from '../ListRow/ListRow.native';
import { toneColors } from '../../tokens/tones';
import { radii, spacing } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { ActionSheetItem, ActionSheetProps } from './ActionSheet.types';

type IconProps = { color?: string; size?: number; strokeWidth?: number };
const paint = (icon: ReactNode, color: string, size: number) =>
  isValidElement(icon) ? cloneElement(icon as ReactElement<IconProps>, { color, size, strokeWidth: 2.2 }) : icon;

/**
 * «Más» sheet (MASTER §7, mockups module 14): system sheet header, the card's actions as a list,
 * and the destructive ones as their own group of red rows with a subtitle, no chevron.
 */
export function ActionSheet({ title, eyebrow, icon, tone = 'brand', actions, destructive = [], onClose }: ActionSheetProps) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  const run = (item: ActionSheetItem) => ref.current?.close(item.onPress);
  const group = [styles.group, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }];

  return (
    <BottomSheet
      ref={ref}
      title={title}
      eyebrow={eyebrow}
      icon={icon ? <IconTile round size="lg" tone={tone} icon={paint(icon, toneColors(tone, t.mode).fg, 24)} /> : undefined}
      onClose={onClose}
    >
      <View style={styles.body}>
        <View style={group}>
          {actions.map((a) => (
            <View key={a.key} style={styles.row}>
              <ListRow
                title={a.label}
                meta={a.meta}
                icon={paint(a.icon, t.text.secondary, 19)}
                tone="neutral"
                trailing={<ChevronRight size={18} color={t.text.muted} />}
                onPress={() => run(a)}
              />
            </View>
          ))}
        </View>
        {destructive.length > 0 ? (
          <View style={group}>
            {destructive.map((a) => (
              <View key={a.key} style={styles.row}>
                <ListRow
                  title={a.label}
                  meta={a.meta}
                  icon={paint(a.icon, t.status.errorFg, 19)}
                  destructive
                  onPress={() => run(a)}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  group: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: radii.card, borderWidth: 1, borderBottomWidth: 4 },
  row: { paddingVertical: 6 },
});
