import { useEffect, type ReactNode } from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { motion, motionEasing, useReducedMotion } from "@helu/ui";

/**
 * Tab switch fade (movimiento-interacciones.md §3 · «Cambiar de pestaña»), on the UI thread.
 *
 * bottom-tabs' own `animation: "fade"` drives each scene's opacity with the JS `Animated` API.
 * On a real iPhone, switching fast between tabs could leave a scene at opacity 0: Inicio
 * stayed blank until another tab was tapped. The navigator now switches at once and each scene
 * fades itself in here with Reanimated; every focus animates to 1, so nothing can stay hidden.
 */
export function TabSceneFade({
  navigation,
  routeKey,
  children,
}: {
  navigation: NavigationProp<ParamListBase>;
  routeKey: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced || !navigation.isFocused() ? 1 : 0);

  useEffect(() => {
    const show = () => {
      opacity.value = reduced ? 1 : withTiming(1, { duration: motion.fast, easing: motionEasing.out });
    };
    // Only when another tab is chosen (not on "blur", which also fires when a detail is pushed
    // over the tabs and this scene must stay visible under it). That tab is already off screen,
    // so starting it at 0 lets the next visit fade in.
    const offState = navigation.addListener("state", (e) => {
      const state = e.data.state as { index: number; routes: { key: string }[] } | undefined;
      if (!reduced && state && state.routes[state.index]?.key !== routeKey) opacity.value = 0;
    });
    if (navigation.isFocused()) show();
    const offFocus = navigation.addListener("focus", show);
    return () => {
      offFocus();
      offState();
    };
  }, [navigation, opacity, reduced, routeKey]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}
