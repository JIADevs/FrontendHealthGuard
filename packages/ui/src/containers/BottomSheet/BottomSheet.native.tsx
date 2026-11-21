import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscardChangesDialog } from '../../composed/DiscardChangesDialog/DiscardChangesDialog.native';
import { motion, radii, spacing, fontSize, nativeFont } from '../../tokens/tokens';
import { semanticLight } from '../../tokens/semantic';
import { motionEasing } from '../../motion/motion.native';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { ThemeContextValue } from '../../tokens/ThemeProvider';
import type { BottomSheetHandle, BottomSheetProps } from './BottomSheet.types';

/**
 * Hoja inferior v2 (movimiento-interacciones.md §4):
 * - abre: fondo 0 → 50 % en 250 ms y la hoja sube con resorte (damping 18 · stiffness 220);
 * - arrastre: sigue el dedo desde 8 px; si bajó más del 30 % o va a más de 800 px/s, se cierra;
 * - cierra: baja con `ease-in` en 220 ms y el fondo se desvanece;
 * - con cambios sin guardar: vuelve con resorte y pregunta «¿Descartar los cambios?»;
 * - movimiento reducido: solo fundido de 150 ms.
 * `ref.close(after?)` anima la salida desde la pantalla (por ejemplo, al guardar).
 */
export function BottomSheet({
  title,
  eyebrow,
  icon,
  dirty = false,
  onClose,
  children,
  ref,
}: BottomSheetProps & { ref?: Ref<BottomSheetHandle> }) {
  const t = useAppTheme();
  const styles = makeStyles(t);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const [confirming, setConfirming] = useState(false);
  const sheetHeight = useRef(windowHeight * 0.6);

  const translateY = useSharedValue(reduced ? 0 : windowHeight);
  const backdrop = useSharedValue(0);
  const sheetOpacity = useSharedValue(reduced ? 0 : 1);
  const closing = useRef(false);

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: reduced ? motion.fast : motion.base });
    if (reduced) {
      sheetOpacity.value = withTiming(1, { duration: motion.fast });
    } else {
      translateY.value = withSpring(0, motion.sheetSpring);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateOut = (after?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    const done = () => {
      onClose();
      after?.();
    };
    backdrop.value = withTiming(0, { duration: reduced ? motion.fast : motion.exit });
    if (reduced) {
      sheetOpacity.value = withTiming(0, { duration: motion.fast }, (finished) => {
        if (finished) runOnJS(done)();
      });
    } else {
      translateY.value = withTiming(
        sheetHeight.current + insets.bottom,
        { duration: motion.exit, easing: motionEasing.in },
        (finished) => {
          if (finished) runOnJS(done)();
        },
      );
    }
  };

  const springBack = () => {
    translateY.value = reduced ? 0 : withSpring(0, motion.sheetSpring);
  };

  // Los manejadores del gesto leen siempre la versión actual (dirty cambia mientras la hoja está abierta).
  const requestCloseRef = useRef<() => void>(() => {});
  requestCloseRef.current = () => {
    if (dirty) {
      springBack();
      setConfirming(true);
      return;
    }
    animateOut();
  };

  useImperativeHandle(ref, () => ({ close: (after?: () => void) => animateOut(after) }));

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_event, gesture) => {
        translateY.value = Math.max(0, gesture.dy);
      },
      onPanResponderRelease: (_event, gesture) => {
        // vy en px/ms: 0,8 = 800 px/s
        if (gesture.dy > sheetHeight.current * 0.3 || gesture.vy > 0.8) {
          requestCloseRef.current();
          return;
        }
        springBack();
      },
    }),
  ).current;

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <RNModal transparent visible animationType="none" onRequestClose={() => requestCloseRef.current()}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => requestCloseRef.current()}
            accessibilityLabel="Cerrar"
          />
        </Animated.View>
        <Animated.View
          onLayout={(event) => {
            sheetHeight.current = event.nativeEvent.layout.height;
          }}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }, sheetStyle]}
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
            animateOut();
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
      // MASTER §7: fondo rgba(15,23,42,.5)
      backgroundColor: semanticLight.overlay,
    },
    sheet: {
      maxHeight: '88%',
      backgroundColor: t.surface.bgCard,
      // MASTER §6: hoja radio 28
      borderTopLeftRadius: radii.sheet,
      borderTopRightRadius: radii.sheet,
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
      gap: spacing[4],
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
    // MASTER §5: eyebrow Nunito 900 11, mayúsculas, .08em
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont('heading', 900),
      textTransform: 'uppercase',
      letterSpacing: 0.9,
      color: t.text.primary,
      marginBottom: spacing[1],
    },
    // Kit `sheetHead`: H2 de 19 px
    title: {
      fontSize: 19,
      fontFamily: nativeFont('heading', 900),
      color: t.text.primary,
    },
    close: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.surface.muted,
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
