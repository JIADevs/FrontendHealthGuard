import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, palette, radii, spacing, useAppTheme } from '@helu/ui';
import type { ThemeContextValue } from '@helu/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FabOption {
  label: string;
  icon: ReactNode;
  color: string;
  onPress: () => void;
}

export interface ExpandableFABProps {
  /** Options shown when the FAB is expanded (bottom to top order) */
  options: FabOption[];
  /** Optional accessibility label for the main button */
  accessibilityLabel?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExpandableFAB({ options, accessibilityLabel = 'Abrir menú' }: ExpandableFABProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    const toValue = open ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  }, [open, animation]);

  const close = useCallback(() => {
    Animated.spring(animation, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setOpen(false);
  }, [animation]);

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const optionScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const optionOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>
      )}

      {/* Options — rendered bottom-to-top */}
      {options.map((opt, i) => {
        const reverseIndex = options.length - i;
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -reverseIndex * 70],
        });

        return (
          <Animated.View
            key={opt.label}
            style={[
              styles.fabOption,
              {
                transform: [{ translateY }, { scale: optionScale }],
                opacity: optionOpacity,
              },
            ]}
            pointerEvents={open ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.fabOptionRow}
              onPress={() => {
                close();
                opt.onPress();
              }}
            >
              <View style={styles.fabOptionLabel}>
                <Text style={styles.fabOptionLabelText}>{opt.label}</Text>
              </View>
              <View style={[styles.fabSmall, { backgroundColor: opt.color }]}>
                {opt.icon}
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggle}
        activeOpacity={0.85}
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Plus color={colors.white} size={28} />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.black,
    },
    fab: {
      position: 'absolute',
      right: spacing[5],
      bottom: spacing[6],
      width: 56,
      height: 56,
      borderRadius: radii.full,
      backgroundColor: palette.brand[500],
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      zIndex: 90,
    },
    fabOption: {
      position: 'absolute',
      right: spacing[5],
      bottom: spacing[6],
      zIndex: 91,
      flexDirection: 'row',
      alignItems: 'center',
    },
    fabOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    fabOptionLabel: {
      backgroundColor: t.surface.bgCard,
      borderWidth: 1,
      borderColor: t.border.medium,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.sm,
      elevation: 2,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    fabOptionLabelText: {
      color: t.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    fabSmall: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
  });
}
