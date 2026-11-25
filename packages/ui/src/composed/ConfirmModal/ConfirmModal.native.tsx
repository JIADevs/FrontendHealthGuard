import { cloneElement, isValidElement } from 'react';
import type { ReactElement } from 'react';
import { Modal as RNModal, View, Text, StyleSheet } from 'react-native';
import { Button } from '../../primitives/Button/Button.native';
import { IconTile } from '../../primitives/IconTile/IconTile.native';
import { toneColors } from '../../tokens/tones';
import type { Tone } from '../../tokens/tones';
import { radii, spacing, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { ThemeContextValue } from '../../tokens/ThemeProvider';
import type { ConfirmModalIconTone, ConfirmModalProps } from './ConfirmModal.types';

const ICON_TONE: Record<ConfirmModalIconTone, Tone> = {
  danger:  'danger',
  warning: 'warning',
  primary: 'brand',
  info:    'info',
  neutral: 'neutral',
};

/**
 * Confirmation dialog, mobile style v2.33 (MASTER §7 «Diálogo de confirmación», mockup `dlg()`):
 * centered 350 px card, round icon tile, question + consequence, and the two actions always
 * stacked — the safe option first, then the action with its exact verb. No close button: it
 * closes with the safe option or the system back button. `actionsLayout` only applies on web.
 */
export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  keepLabel = 'Cancelar',
  keepVariant = 'secondary',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  icon,
  iconTone = 'danger',
}: ConfirmModalProps) {
  const t = useAppTheme();
  const styles = makeStyles(t);
  const tone = ICON_TONE[iconTone];
  // The icon takes the tone's color and the spec size (24 px, stroke 2.2), whatever the caller passed.
  const toneIcon = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ color?: string; size?: number; strokeWidth?: number }>, {
        color: toneColors(tone, t.mode).fg,
        size: 24,
        strokeWidth: 2.2,
      })
    : icon;

  return (
    <RNModal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? () => {} : onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          {toneIcon ? <IconTile icon={toneIcon} tone={tone} size="lg" round /> : null}
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button variant={keepVariant} fullWidth onPress={onCancel} disabled={loading}>
              {keepLabel}
            </Button>
            <Button variant={confirmVariant} fullWidth onPress={onConfirm} disabled={loading} loading={loading}>
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(15,23,42,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing[5],
    },
    card: {
      width: '100%',
      maxWidth: 350,
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.modal,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      padding: spacing[6],
      alignItems: 'center',
      gap: spacing[4],
    },
    title: {
      fontSize: 19,
      lineHeight: 23,
      fontFamily: nativeFont('heading', 900),
      color: t.text.primary,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      lineHeight: 21,
      color: t.text.secondary,
      textAlign: 'center',
    },
    actions: {
      width: '100%',
      gap: 10,
      marginTop: spacing[1],
    },
  });
}
