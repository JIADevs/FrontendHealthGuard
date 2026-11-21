import { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscardChangesDialog } from '../../composed/DiscardChangesDialog/DiscardChangesDialog.native';
import { overlay, radii, spacing, fontSize, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { ThemeContextValue } from '../../tokens/ThemeProvider';
import type { BottomSheetProps } from './BottomSheet.types';

const DISMISS_DRAG = 96;

export function BottomSheet({
  title,
  eyebrow,
  icon,
  dirty = false,
  onClose,
  children,
}: BottomSheetProps) {
  const t = useAppTheme();
  const styles = makeStyles(t);
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const requestCloseRef = useRef<() => void>(() => {});

  requestCloseRef.current = () => {
    if (dirty) {
      setConfirming(true);
      return;
    }
    onClose();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_event, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > DISMISS_DRAG) {
          translateY.setValue(0);
          requestCloseRef.current();
          return;
        }
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  return (
    <RNModal transparent visible animationType="slide" onRequestClose={() => requestCloseRef.current()}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => requestCloseRef.current()}
          accessibilityLabel="Cerrar"
        />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing[4]), transform: [{ translateY }] },
          ]}
        >
          <View {...pan.panHandlers}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <View style={styles.titles}>
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                <Text style={styles.title}>{title}</Text>
              </View>
              <Pressable
                style={styles.close}
                onPress={() => requestCloseRef.current()}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={18} color={t.text.secondary} />
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
      {confirming ? (
        <DiscardChangesDialog
          onKeep={() => setConfirming(false)}
          onDiscard={() => {
            setConfirming(false);
            onClose();
          }}
        />
      ) : null}
    </RNModal>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    fill: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: overlay.darker,
    },
    sheet: {
      maxHeight: '88%',
      backgroundColor: t.surface.bgCard,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      marginTop: spacing[2],
      borderRadius: radii.full,
      backgroundColor: t.border.medium,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingHorizontal: spacing[5],
      paddingTop: spacing[3],
      paddingBottom: spacing[4],
    },
    icon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    titles: {
      flex: 1,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont('body', 600),
      color: t.text.secondary,
      marginBottom: spacing[1],
    },
    title: {
      fontSize: fontSize.lg,
      fontFamily: nativeFont('heading', 800),
      color: t.text.primary,
    },
    close: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flexGrow: 0,
    },
    bodyContent: {
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[4],
    },
  });
}
