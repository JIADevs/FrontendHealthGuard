import { useEffect, type ReactNode } from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { motion, motionEasing, useReducedMotion } from "@helu/ui";

/**
 * Tab switch (movimiento-interacciones.md §3 · «Cambiar de pestaña»), on the UI thread: the new
 * tab enters in 250 ms rising 4 px, like Agenda's inner tabs.
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
  // 0 = hidden and 4 px low, 1 = in place.
  const shown = useSharedValue(reduced || !navigation.isFocused() ? 1 : 0);

  useEffect(() => {
    const show = () => {
      shown.value = reduced ? 1 : withTiming(1, { duration: motion.base, easing: motionEasing.standard });
    };
    // Only when another tab is chosen (not on "blur", which also fires when a detail is pushed
    // over the tabs and this scene must stay visible under it). That tab is already off screen,
    // so starting it at 0 lets the next visit fade in.
    const offState = navigation.addListener("state", (e) => {
      const state = e.data.state as { index: number; routes: { key: string }[] } | undefined;
      if (!reduced && state && state.routes[state.index]?.key !== routeKey) shown.value = 0;
    });
    if (navigation.isFocused()) show();
    const offFocus = navigation.addListener("focus", show);
    return () => {
      offFocus();
      offState();
    };
  }, [navigation, shown, reduced, routeKey]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * RISE }],
  }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

const RISE = 4;
