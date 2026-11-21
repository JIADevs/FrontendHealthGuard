import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { radii, spacing, fontSize, nativeFont } from '../../tokens/tokens';
import { semanticDark, semanticLight } from '../../tokens/semantic';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { CardProps } from './Card.types';

export function Card({ title, subtitle, icon, iconBackground, children, actions, footer, footerDivider = true, onPress, variant = 'default', tone }: CardProps) {
  const t = useAppTheme();
  const s = t.mode === 'dark' ? semanticDark : semanticLight;
  // v2 (MASTER §6–7): radio 18, borde 1 px + canto inferior de 3 px del color del borde
  const toneColors = tone === 'streak'
    ? { bg: s['motivation-streak-bg'], border: s['motivation-streak-border'] }
    : tone === 'ai'
    ? { bg: s['feature-ai-bg'], border: s['feature-ai-fg'] }
    : tone === 'success'
    ? { bg: s['success-bg'], border: s['success-fg'] }
    : null;
  const borderColor = variant === 'selected' ? t.brand.solid : toneColors?.border ?? t.border.default;
  const pad = variant === 'compact' ? spacing[3] : spacing[4];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: toneColors?.bg ?? t.surface.bgCard,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor,
      overflow: 'hidden',
    },
    main: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[3],
      padding: pad,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 16,
      fontFamily: nativeFont('heading', 800),
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
      paddingHorizontal: pad,
      borderTopWidth: 1,
      borderTopColor: t.border.default,
    },
    footerPlain: { borderTopWidth: 0, paddingTop: 0 },
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

      {footer && <View style={[styles.footer, !footerDivider && styles.footerPlain]}>{footer}</View>}
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
