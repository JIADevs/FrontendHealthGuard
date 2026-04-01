/**
 * useNotificationsCore — lógica de notificaciones agnóstica de plataforma.
 *
 * Gestiona:
 *  - Marcar una notificación como leída (con decremento del store).
 *  - Marcar todas como leídas (bulk, sin mutaciones individuales).
 *  - Sincronización del conteo de no leídas al store de Zustand.
 *
 * El tipo de query (paginada vs. infinita) queda en cada plataforma, que pasa
 * la lista plana de notificaciones y su función de refetch.
 */

import { useCallback, useEffect } from "react";
import { useMarkNotificationReadMutation } from "./hooks";
import { markNotificationAsRead, type Notification } from "./index";
import { useNotifStore } from "@healthguard/stores";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationsCoreState {
  unreadCount: number;
  isMarkingRead: boolean;
}

export interface NotificationsCoreActions {
  /** Marca una notificación como leída. No-op si ya está leída. */
  markRead: (id: string) => void;
  /** Marca todas las notificaciones no leídas como leídas y refetchea. */
  markAllRead: () => Promise<void>;
}

// ─── Core hook ────────────────────────────────────────────────────────────────

export function useNotificationsCore({
  notifications,
  refetch,
}: {
  notifications: Notification[];
  refetch: () => void;
}): NotificationsCoreState & NotificationsCoreActions {
  const { decrementUnread, markAllRead: markAllReadStore, setUnreadCount } = useNotifStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mantiene el store sincronizado con la lista actual.
  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount, setUnreadCount]);

  const markReadMut = useMarkNotificationReadMutation();

  const markRead = useCallback(
    (id: string) => {
      const notif = notifications.find((n) => n.id === id);
      if (!notif || notif.isRead) return;
      markReadMut.mutate(id, { onSuccess: () => decrementUnread() });
    },
    [notifications, markReadMut, decrementUnread],
  );

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    await Promise.allSettled(unread.map((n) => markNotificationAsRead(n.id)));
    markAllReadStore();
    refetch();
  }, [notifications, markAllReadStore, refetch]);

  return {
    unreadCount,
    isMarkingRead: markReadMut.isPending,
    markRead,
    markAllRead,
  };
}
