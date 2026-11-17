---
name: realtime-integration
description: >
  Conecta el frontend Helu con WebSockets y push notifications reales del backend FastAPI.
  Usar cuando se implemente progreso en tiempo real de jobs (importación de documentos),
  se registren device tokens para FCM, se construya el notification center, se manejen
  notificaciones push con deep linking, o se implemente reconexión automática de WebSocket.
  Aplica tanto a apps/mobile (Expo) como a apps/web (Next.js).
---

# Realtime Integration — Helu

## WebSocket — Progreso de jobs

### Conexión al WebSocket

```ts
// packages/api/src/websocket.ts
import { env } from "@helu/config";
import { useAuthStore } from "@helu/stores";

type WSMessage = {
  status?: "processing" | "completed" | "failed";
  step?: string;
  current_progress?: number;
  total_progress?: number;
  current_file?: string;
  error?: string;
};

export function createJobWebSocket(
  jobId: string,
  onMessage: (msg: WSMessage) => void,
  onClose?: () => void
): WebSocket {
  const token = useAuthStore.getState().token;
  const wsUrl = env.API_URL.replace("http", "ws");
  const ws = new WebSocket(`${wsUrl}/api/v1/jobs/${jobId}/ws?token=${token}`);

  ws.onmessage = (event) => {
    const data: WSMessage = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onclose = () => onClose?.();
  ws.onerror = () => ws.close();

  return ws;
}
```

### Hook de progreso de job

```ts
// packages/features/src/jobs/hooks/useJobProgress.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { createJobWebSocket } from "@helu/api";

type JobProgress = {
  status: "idle" | "processing" | "completed" | "failed";
  current: number;
  total: number;
  currentFile: string | null;
  step: string | null;
  error: string | null;
};

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress>({
    status: "idle", current: 0, total: 0,
    currentFile: null, step: null, error: null,
  });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const ws = createJobWebSocket(jobId, (msg) => {
      setProgress((prev) => ({
        ...prev,
        status: msg.status ?? prev.status,
        current: msg.current_progress ?? prev.current,
        total: msg.total_progress ?? prev.total,
        currentFile: msg.current_file ?? prev.currentFile,
        step: msg.step ?? prev.step,
        error: msg.error ?? prev.error,
      }));
    });

    wsRef.current = ws;
    return () => ws.close();
  }, [jobId]);

  const disconnect = useCallback(() => wsRef.current?.close(), []);

  return { progress, disconnect };
}
```

### Componente de progreso

```tsx
// packages/features/src/jobs/components/JobProgressBar.tsx
import { View, Text } from "react-native";
import { useJobProgress } from "../hooks/useJobProgress";

type Props = { jobId: string | null };

export function JobProgressBar({ jobId }: Props) {
  const { progress } = useJobProgress(jobId);

  if (progress.status === "idle") return null;

  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <View className="bg-surface rounded-xl p-4 gap-2">
      <View className="flex-row justify-between">
        <Text className="text-sm font-semibold text-gray-700">
          {progress.status === "completed" ? "✅ Completado" :
           progress.status === "failed" ? "❌ Error" :
           `Procesando ${progress.current}/${progress.total}`}
        </Text>
      </View>
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
      {progress.currentFile && (
        <Text className="text-xs text-gray-400">{progress.currentFile}</Text>
      )}
      {progress.error && (
        <Text className="text-xs text-error">{progress.error}</Text>
      )}
    </View>
  );
}
```

---

## Push Notifications — Firebase Cloud Messaging

### Registro de device token

```ts
// packages/features/src/notifications/hooks/useDeviceToken.ts
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiClient } from "@helu/api";
import { useAuthStore } from "@helu/stores";

export function useDeviceTokenRegistration() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token || Platform.OS === "web") return;

    async function register() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const pushToken = await Notifications.getExpoPushTokenAsync();

      await apiClient.post("/notifications/device-token", {
        token: pushToken.data,
        deviceType: Platform.OS,  // "ios" | "android"
      });
    }

    register();
  }, [token]);
}
```

### Listener de notificaciones

```ts
// packages/features/src/notifications/hooks/useNotificationListener.ts
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

export function useNotificationListener() {
  const router = useRouter();

  useEffect(() => {
    // Cuando el usuario toca una notificación
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const entityId = data?.entityId as string | undefined;

        // Navegar al recurso
        if (entityId) {
          // El tipo de notificación determina la ruta
          const type = data?.type as string;
          if (type === "APPOINTMENT") router.push(`/appointments/${entityId}`);
          if (type === "MEDICATION") router.push(`/medications/${entityId}`);
        }
      }
    );

    return () => subscription.remove();
  }, [router]);
}
```

---

## Notification Center

### Endpoints del backend

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/notifications/?page=1&limit=20` | Listar notificaciones paginadas |
| PATCH | `/api/v1/notifications/{id}` | Marcar como leída |
| POST | `/api/v1/notifications/device-token` | Registrar device token |

### Hook de notificaciones

```ts
// packages/features/src/notifications/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@helu/api";
import { z } from "zod";

const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  type: z.enum(["APPOINTMENT", "MEDICATION", "CHECKIN", "SYSTEM", "INFO"]),
  entityId: z.string().uuid().nullable(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});

const NotificationPageSchema = z.object({
  items: z.array(NotificationSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const notifKeys = {
  all: () => ["notifications"] as const,
  list: (page: number) => [...notifKeys.all(), "list", page] as const,
  unreadCount: () => [...notifKeys.all(), "unread"] as const,
};

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: notifKeys.list(page),
    queryFn: async () => {
      const { data } = await apiClient.get(`/notifications?page=${page}&limit=20`);
      return NotificationPageSchema.parse(data);
    },
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}`, { isRead: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
  });
}
```

---

## Reglas del equipo

- WebSocket solo para progreso de jobs — no para datos generales (usar TanStack Query)
- Device tokens se registran al iniciar la app autenticada — solo en mobile
- Notificaciones web usan `Web Notifications API` (ver skill `platform-component`)
- El `entityId` en la notificación push determina a dónde navegar
- Reconexión de WebSocket: si se desconecta, usar `setTimeout` con backoff exponencial
- Notification center: prefetch de la primera página al montar el layout principal
