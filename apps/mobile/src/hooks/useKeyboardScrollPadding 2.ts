import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/** Padding extra al final del ScrollView solo mientras el teclado está visible. */
export function useKeyboardScrollPadding(basePadding = 120): number {
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setExtra(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setExtra(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return basePadding + extra;
}
