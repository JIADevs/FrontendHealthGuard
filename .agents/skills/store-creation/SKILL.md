---
name: store-creation
description: >
  Crea o modifica stores de Zustand para la app Helu.
  Usar cuando se necesite estado global (sesión, tema, preferencias UI, notificaciones),
  cuando se configure persistencia con MMKV en mobile o localStorage en web,
  cuando se separe estado del servidor (TanStack Query) de estado local (Zustand),
  o cuando haya dudas sobre qué debe ir en un store vs en un hook local.
  Incluye el patrón seguro para datos sensibles con expo-secure-store.
  Para el flujo de auth completo con auto-refresh ver skill `backend-auth-flow`.
---

# Store Creation — Helu

## Regla de oro: Zustand vs TanStack Query

| Tipo de estado | Dónde va | Ejemplo |
|---|---|---|
| Datos del servidor | TanStack Query | Citas, medicamentos, registros |
| Sesión del usuario | Zustand + MMKV | Token, datos del perfil en memoria |
| Preferencias UI | Zustand + MMKV | Tema, idioma, notificaciones on/off |
| Estado de pantalla | useState local | Modal abierto, tab activo |
| Datos sensibles | expo-secure-store | Token de auth (mobile) |

**Nunca guardar respuestas de API en Zustand.**

## Estructura del package @helu/stores

```
packages/stores/src/
├── storage.ts          ← adaptador MMKV / localStorage
├── authStore.ts        ← sesión, tokens y delegación
├── uiStore.ts          ← tema, idioma, preferencias
├── notifStore.ts       ← device token y unread count
└── index.ts
```

## Adaptador de storage (MMKV en mobile, localStorage en web)

```ts
// packages/stores/src/storage.ts
import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

function createStorage(): StateStorage {
  if (Platform.OS === "web") {
    return {
      getItem:    (key) => localStorage.getItem(key),
      setItem:    (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    };
  }
  // MMKV — solo se importa en mobile para no romper el bundle web
  const { MMKV } = require("react-native-mmkv");
  const mmkv = new MMKV({ id: "helu-store" });
  return {
    getItem:    (key) => mmkv.getString(key) ?? null,
    setItem:    (key, value) => mmkv.set(key, value),
    removeItem: (key) => mmkv.delete(key),
  };
}

export const storage = createStorage();
```

## Store de autenticación (con refresh token y delegación)

```ts
// packages/stores/src/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "./storage";

type User = {
  id:        string;
  name:      string;
  email:     string;
};

type AuthState = {
  // Estado
  token:            string | null;
  refreshToken:     string | null;
  user:             User | null;
  isHydrated:       boolean;
  // Delegación — manager operando como paciente
  activePatientId:  string | null;
  isManaging:       boolean;
  // Acciones
  setAuth:          (token: string, refreshToken: string) => void;
  setUser:          (user: User) => void;
  updateUser:       (partial: Partial<User>) => void;
  setPatientContext:(patientId: string | null) => void;
  logout:           () => void;
  setHydrated:      () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:           null,
      refreshToken:    null,
      user:            null,
      isHydrated:      false,
      activePatientId: null,
      isManaging:      false,
      setAuth:         (token, refreshToken) => set({ token, refreshToken }),
      setUser:         (user) => set({ user }),
      updateUser:      (partial) => set((s) => ({
        user: s.user ? { ...s.user, ...partial } : null,
      })),
      setPatientContext: (patientId) => set({
        activePatientId: patientId,
        isManaging: !!patientId,
      }),
      logout:          () => set({
        token: null, refreshToken: null, user: null,
        activePatientId: null, isManaging: false,
      }),
      setHydrated:     () => set({ isHydrated: true }),
    }),
    {
      name:    "auth-store",
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

// Selector helpers
export const useToken      = () => useAuthStore((s) => s.token);
export const useUser       = () => useAuthStore((s) => s.user);
export const useIsAuth     = () => useAuthStore((s) => !!s.token);
export const useIsManaging = () => useAuthStore((s) => s.isManaging);
```

## Store de UI (tema, idioma, preferencias)

```ts
// packages/stores/src/uiStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "./storage";

type Theme = "light" | "dark" | "system";
type Language = "es" | "en";

type UiState = {
  theme:                Theme;
  language:             Language;
  notificationsEnabled: boolean;
  reminderMinutesBefore: number;
  setTheme:             (theme: Theme) => void;
  setLanguage:          (lang: Language) => void;
  toggleNotifications:  () => void;
  setReminderMinutes:   (minutes: number) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme:                 "system",
      language:              "es",
      notificationsEnabled:  true,
      reminderMinutesBefore: 30,
      setTheme:              (theme) => set({ theme }),
      setLanguage:           (language) => set({ language }),
      toggleNotifications:   () => set((s) => ({
        notificationsEnabled: !s.notificationsEnabled,
      })),
      setReminderMinutes:    (minutes) => set({ reminderMinutesBefore: minutes }),
    }),
    {
      name:    "ui-store",
      storage: createJSONStorage(() => storage),
    }
  )
);

// Selectors
export const useTheme    = () => useUiStore((s) => s.theme);
export const useLanguage = () => useUiStore((s) => s.language);
```

## Store de notificaciones (device token + unread count)

```ts
// packages/stores/src/notifStore.ts
import { create } from "zustand";

type NotifState = {
  unreadCount:      number;
  isDeviceRegistered: boolean;
  lastChecked:      string | null;
  setUnreadCount:   (count: number) => void;
  decrementUnread:  () => void;
  setDeviceRegistered: () => void;
  markChecked:      () => void;
};

// Sin persist — se recarga desde el servidor al iniciar
export const useNotifStore = create<NotifState>()((set) => ({
  unreadCount:      0,
  isDeviceRegistered: false,
  lastChecked:      null,
  setUnreadCount:   (count) => set({ unreadCount: count }),
  decrementUnread:  () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  setDeviceRegistered: () => set({ isDeviceRegistered: true }),
  markChecked:      () => set({ lastChecked: new Date().toISOString(), unreadCount: 0 }),
}));

export const useUnreadCount = () => useNotifStore((s) => s.unreadCount);
```

## Datos sensibles en mobile — expo-secure-store

```ts
// packages/stores/src/secureStorage.ts (solo para mobile)
// NO usar Zustand para esto — expo-secure-store maneja el keychain directamente
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEYS = {
  AUTH_TOKEN:     "auth_token",
  REFRESH_TOKEN:  "refresh_token",
} as const;

export const secureStorage = {
  async saveToken(token: string): Promise<void> {
    if (Platform.OS === "web") {
      // En web usar httpOnly cookies vía el backend — nunca localStorage para tokens
      return;
    }
    await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token);
  },
  async getToken(): Promise<string | null> {
    if (Platform.OS === "web") return null;
    return SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
  },
  async clearTokens(): Promise<void> {
    if (Platform.OS === "web") return;
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    ]);
  },
};
```

## Reglas del equipo

- Exportar selector helpers (`useToken`, `useUser`, `useUnreadCount`) — no el store completo
- Nunca usar `useAuthStore.getState()` en componentes — usar hooks/selectors
- `getState()` solo está permitido en interceptors de Axios (ver skill `api-integration`)
- Si un estado solo se usa en una pantalla, usar `useState` local
- Stores sin persist para estado efímero (notificaciones, loading global)
- `refreshToken` se persiste en el auth store — en mobile también guardarlo en `secureStorage`
- Delegación (`activePatientId`) no se persiste — se resetea al recargar
