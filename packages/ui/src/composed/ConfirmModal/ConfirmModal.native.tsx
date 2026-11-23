import { Modal as RNModal, View, Text, StyleSheet } from 'react-native';
import { Button } from '../../primitives/Button/Button.native';
import { Modal } from '../../containers/Modal/Modal.native';
import { Typography } from '../../primitives/Typography/Typography.native';
import { IconTile } from '../../primitives/IconTile/IconTile.native';
import type { Tone } from '../../tokens/tones';
import { radii, spacing, fontSize, fontWeight, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { ThemeContextValue } from '../../tokens/ThemeProvider';
import type { ConfirmModalIconTone, ConfirmModalProps } from './ConfirmModal.types';

const ICON_TONE: Record<ConfirmModalIconTone, Tone> = {
  danger:  'danger',
  warning: 'warning',
  primary: 'brand',
  info:    'info',
};

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
  actionsLayout = 'row',
}: ConfirmModalProps) {
  if (icon) {
    return (
      <CenteredConfirmModal
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        keepLabel={keepLabel}
        keepVariant={keepVariant}
        confirmVariant={confirmVariant}
        loading={loading}
        onConfirm={onConfirm}
        onCancel={onCancel}
        icon={icon}
        iconTone={iconTone}
        actionsLayout={actionsLayout}
      />
    );
  }

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        actionsLayout === 'stacked' ? (
          // Long labels: full-width buttons, the safe option first (same as the centered variant).
          <View style={{ flex: 1, gap: spacing[3] }}>
            <Button variant={keepVariant} fullWidth onPress={onCancel} disabled={loading}>{keepLabel}</Button>
            <Button variant={confirmVariant} fullWidth onPress={onConfirm} disabled={loading} loading={loading}>
              {confirmLabel}
            </Button>
          </View>
        ) : (
          <>
            {/* Both options fill the row (no empty gap on the right) and never shrink below their label. */}
            <View style={{ flexGrow: 1 }}>
              <Button variant={keepVariant} fullWidth onPress={onCancel} disabled={loading}>{keepLabel}</Button>
            </View>
            <View style={{ flexGrow: 1 }}>
              <Button variant={confirmVariant} fullWidth onPress={onConfirm} disabled={loading} loading={loading}>
                {confirmLabel}
              </Button>
            </View>
          </>
        )
      }
    >
      <Typography variant="body" color="secondary">{message}</Typography>
    </Modal>
  );
}

function CenteredConfirmModal({
  title,
  message,
  confirmLabel,
  keepLabel,
  keepVariant = 'secondary',
  confirmVariant,
  loading,
  onConfirm,
  onCancel,
  icon,
  iconTone,
  actionsLayout,
}: Required<Pick<ConfirmModalProps, 'title' | 'message' | 'confirmLabel' | 'confirmVariant' | 'loading' | 'onConfirm' | 'onCancel' | 'icon' | 'iconTone'>> &
  Pick<ConfirmModalProps, 'actionsLayout' | 'keepLabel' | 'keepVariant'>) {
  const t = useAppTheme();
  const styles = makeStyles(t);
  const stacked = actionsLayout === 'stacked';

  return (
    <RNModal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <IconTile icon={icon} tone={ICON_TONE[iconTone]} size="lg" round />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {stacked ? (
              <>
                {/* v2: la opción segura va primero */}
                <Button variant={keepVariant} fullWidth onPress={onCancel} disabled={loading}>
                  {keepLabel}
                </Button>
                <Button
                  variant={confirmVariant}
                  fullWidth
                  onPress={onConfirm}
                  disabled={loading}
                  loading={loading}
                >
                  {confirmLabel}
                </Button>
              </>
            ) : (
              <>
                <View style={styles.actionFlex}>
                  <Button variant={keepVariant} fullWidth onPress={onCancel} disabled={loading}>
                    {keepLabel}
                  </Button>
                </View>
                <View style={styles.actionFlex}>
                  <Button
                    variant={confirmVariant}
                    fullWidth
                    onPress={onConfirm}
                    disabled={loading}
                    loading={loading}
                  >
                    {confirmLabel}
                  </Button>
                </View>
              </>
            )}
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
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[5],
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.modal,
      borderWidth: 1,
      borderColor: t.border.default,
      paddingHorizontal: spacing[6],
      paddingTop: spacing[6],
      paddingBottom: spacing[5],
      alignItems: 'center',
    },
    iconWrap: {
      marginBottom: spacing[4],
    },
    title: {
      fontSize: fontSize.lg,
      fontFamily: nativeFont('heading', 900),
      color: t.text.primary,
      textAlign: 'center',
      marginBottom: spacing[2],
    },
    message: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
      textAlign: 'center',
      marginBottom: spacing[5],
    },
    actions: {
      flexDirection: 'row',
      gap: spacing[3],
      width: '100%',
    },
    actionFlex: {
      flex: 1,
    },
    actionsStacked: {
      flexDirection: 'column',
    },
  });
}
