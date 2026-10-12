import { Modal as RNModal, View, Text, StyleSheet } from 'react-native';
import { Button } from '../../primitives/Button/Button.native';
import { Modal } from '../../containers/Modal/Modal.native';
import { Typography } from '../../primitives/Typography/Typography.native';
import { palette, radii, spacing, fontSize, fontWeight } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { ThemeContextValue } from '../../tokens/ThemeProvider';
import type { ConfirmModalIconTone, ConfirmModalProps } from './ConfirmModal.types';

const ICON_TONE_BG: Record<ConfirmModalIconTone, string> = {
  danger:  palette.status.error[50],
  warning: palette.status.warning[50],
  primary: palette.brand[50],
  info:    palette.brand[50],
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
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
        <>
          <Button variant="secondary" onPress={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant={confirmVariant} onPress={onConfirm} disabled={loading} loading={loading}>
            {confirmLabel}
          </Button>
        </>
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
  confirmVariant,
  loading,
  onConfirm,
  onCancel,
  icon,
  iconTone,
  actionsLayout,
}: Required<Pick<ConfirmModalProps, 'title' | 'message' | 'confirmLabel' | 'confirmVariant' | 'loading' | 'onConfirm' | 'onCancel' | 'icon' | 'iconTone'>> &
  Pick<ConfirmModalProps, 'actionsLayout'>) {
  const t = useAppTheme();
  const styles = makeStyles(t, iconTone);
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
          <View style={styles.iconWrap}>{icon}</View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {stacked ? (
              <>
                <Button
                  variant={confirmVariant}
                  fullWidth
                  onPress={onConfirm}
                  disabled={loading}
                  loading={loading}
                >
                  {confirmLabel}
                </Button>
                <Button variant="secondary" fullWidth onPress={onCancel} disabled={loading}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <View style={styles.actionFlex}>
                  <Button variant="secondary" fullWidth onPress={onCancel} disabled={loading}>
                    Cancelar
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

function makeStyles(t: ThemeContextValue, iconTone: ConfirmModalIconTone) {
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
      borderRadius: radii.xl,
      paddingHorizontal: spacing[6],
      paddingTop: spacing[6],
      paddingBottom: spacing[5],
      alignItems: 'center',
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: radii.lg,
      backgroundColor: ICON_TONE_BG[iconTone],
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing[4],
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
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
