import {
  Modal as RNModal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, radii, spacing, fontSize, fontWeight } from './tokens';
import { useAppTheme } from './ThemeProvider';
import type { ModalProps } from './Modal.types';

export function Modal({ title, onClose, children, footer }: ModalProps) {
  const t = useAppTheme();

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[5],
    },
    container: {
      width: '100%',
      maxHeight: '85%',
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.xl,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing[5],
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.extrabold as any,
      color: t.text.primary,
      flex: 1,
      marginRight: spacing[3],
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.border.light,
      borderRadius: radii.sm,
    },
    body: {
      padding: spacing[5],
    },
    footer: {
      flexDirection: 'row',
      gap: spacing[3],
      padding: spacing[4],
      borderTopWidth: 1,
      borderTopColor: t.border.medium,
    },
  });

  return (
    <RNModal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={16} color={t.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </View>
    </RNModal>
  );
}
