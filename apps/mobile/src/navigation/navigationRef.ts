import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./RootNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateTo<K extends keyof RootStackParamList>(
    name: K,
    params?: RootStackParamList[K]
) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name as any, params as any);
    }
}

/**
 * Polls `navigationRef.isReady()` until the container mounts or `timeoutMs` elapses.
 * Needed for cold-start deep links: `getLastNotificationResponseAsync()` can resolve
 * before `NavigationContainer` finishes its first render.
 */
export function waitForNavigationReady(timeoutMs = 2000): Promise<boolean> {
    if (navigationRef.isReady()) return Promise.resolve(true);

    return new Promise((resolve) => {
        const intervalMs = 100;
        let elapsed = 0;

        const interval = setInterval(() => {
            if (navigationRef.isReady()) {
                clearInterval(interval);
                resolve(true);
                return;
            }
            elapsed += intervalMs;
            if (elapsed >= timeoutMs) {
                clearInterval(interval);
                resolve(false);
            }
        }, intervalMs);
    });
}
