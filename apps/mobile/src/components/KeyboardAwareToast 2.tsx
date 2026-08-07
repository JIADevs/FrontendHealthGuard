import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { toastConfig } from "./ToastConfig";

const TAB_BAR_OFFSET = 90;
/** Extra space between keyboard top and toast bottom (includes visual breathing room). */
const KEYBOARD_GAP = 64;

/**
 * Keeps bottom toasts above the tab bar, or above the software keyboard when open.
 */
export function KeyboardAwareToast() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (event) => {
            setKeyboardHeight(event.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const bottomOffset =
        keyboardHeight > 0 ? keyboardHeight + KEYBOARD_GAP : TAB_BAR_OFFSET;

    return (
        <Toast
            config={toastConfig}
            position="bottom"
            bottomOffset={bottomOffset}
            visibilityTime={3500}
        />
    );
}
