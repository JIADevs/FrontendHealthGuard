import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, spacing, fontSize, fontWeight } from './tokens';
import { useAppTheme } from './ThemeProvider';
import type { CardProps } from './Card.types';

export function Card({ title, subtitle, icon, iconBackground, children, actions, footer, onPress }: CardProps) {
  const t = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      overflow: 'hidden',
    },
    main: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[3],
      padding: spacing[4],
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold as any,
      color: t.text.primary,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
    },
    actions: {
      gap: spacing[2],
      flexShrink: 0,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing[3],
      paddingHorizontal: spacing[4],
      borderTopWidth: 1,
      borderTopColor: t.border.medium,
    },
  });

  const inner = (
    <>
      {/* Main row */}
      <View style={styles.main}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconBackground ?? t.border.light }]}>
            {icon}
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {subtitle ? (
            typeof subtitle === 'string'
              ? <Text style={styles.subtitle}>{subtitle}</Text>
              : <View>{subtitle}</View>
          ) : null}
          {children ? <View style={{ marginTop: spacing[2] }}>{children}</View> : null}
        </View>

        {actions && <View style={styles.actions}>{actions}</View>}
      </View>

      {footer && <View style={styles.footer}>{footer}</View>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
        {inner}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{inner}</View>;
}
