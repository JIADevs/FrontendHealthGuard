import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pencil, Plus, Trash2, Copy, Share2, Eye } from 'lucide-react-native';
import { colors, palette, radii, spacing, fontSize, fontWeight } from '../../tokens/tokens';
import type { ActionButtonProps, ActionType, ActionButtonSize } from './ActionButton.types';

const iconByAction: Record<ActionType, React.ElementType> = {
  edit:   Pencil,
  create: Plus,
  delete: Trash2,
  copy:   Copy,
  share:  Share2,
  view:   Eye,
};

const colorByAction: Record<ActionType, { fg: string; bg: string }> = {
  edit:   { fg: palette.brand[600],    bg: palette.brand[50] },
  create: { fg: palette.accent.document[600],  bg: palette.accent.document[50] },
  delete: { fg: palette.status.error[600],  bg: palette.status.error[50] },
  copy:   { fg: palette.surface[600],  bg: palette.surface[50] },
  share:  { fg: palette.accent.ai[600], bg: palette.accent.ai[50] },
  view:   { fg: palette.surface[600],  bg: palette.surface[50] },
};

const containerSizePx: Record<ActionButtonSize, number> = { sm: 28, md: 36, lg: 44 };
const iconSizePx:      Record<ActionButtonSize, number> = { sm: 14, md: 18, lg: 22 };
const labelSizePx:     Record<ActionButtonSize, number> = { sm: fontSize.xs, md: fontSize.sm, lg: fontSize.base };

export function ActionButton({
  action,
  onPress,
  size = 'md',
  label,
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const isDisabled = disabled || loading;

  const { fg, bg } = colorByAction[action];
  const Icon = iconByAction[action];
  const containerSize = containerSizePx[size];
  const iconSize = iconSizePx[size];

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.button,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: bg,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <Icon size={iconSize} color={fg} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {label && (
        <Text
          style={{
            fontSize: labelSizePx[size],
            fontWeight: fontWeight.medium,
            color: fg,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing[1],
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
