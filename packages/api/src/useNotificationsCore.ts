/**
 * useNotificationsCore — lógica de notificaciones agnóstica de plataforma.
 *
 * Gestiona:
 *  - Marcar una notificación como leída (con decremento del store).
 *  - Marcar todas como leídas (bulk, sin mutaciones individuales).
 *  Las dos son de bajo riesgo y reversibles (movimiento-interacciones.md §8): la fila y el contador
 *  cambian al tocar y el guardado sigue en segundo plano; si falla, se vuelve a leer del servidor.
 *  - Sincronización del conteo de no leídas al store de Zustand.
 *
 * El tipo de query (paginada vs. infinita) queda en cada plataforma, que pasa
 * la lista plana de notificaciones y su función de refetch.
 */

import { useCallback, useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useMarkNotificationReadMutation } from "./reactQueryHooks";
import { markNotificationAsRead, type Notification } from "./index";
import { useNotifStore } from "@helu/stores";

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

// ─── Optimistic cache ─────────────────────────────────────────────────────────

/** Marks `ids` (or every notification) as read in every cached list, paginated or infinite. */
function markReadInCache(qc: QueryClient, ids: Set<string> | "all") {
  const mark = (items: Notification[]) =>
    items.map((n) => (!n.isRead && (ids === "all" || ids.has(n.id)) ? { ...n, isRead: true } : n));
  qc.setQueriesData({ queryKey: ["notifications"] }, (data: unknown) => {
    if (!data || typeof data !== "object") return data;
    const d = data as { items?: Notification[]; pages?: { items?: Notification[] }[] };
    if (Array.isArray(d.pages)) return { ...d, pages: d.pages.map((p) => (p.items ? { ...p, items: mark(p.items) } : p)) };
    if (Array.isArray(d.items)) return { ...d, items: mark(d.items) };
    return data;
  });
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

  const qc = useQueryClient();
  const markReadMut = useMarkNotificationReadMutation();

  const markRead = useCallback(
    (id: string) => {
      const notif = notifications.find((n) => n.id === id);
      if (!notif || notif.isRead) return;
      // On tap: the row loses its bold and dot and the badge drops; the mutation's onSettled
      // refetches the list, which also undoes this if the server failed.
      void qc.cancelQueries({ queryKey: ["notifications"] });
      markReadInCache(qc, new Set([id]));
      decrementUnread();
      markReadMut.mutate(id);
    },
    [notifications, markReadMut, decrementUnread, qc],
  );

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    void qc.cancelQueries({ queryKey: ["notifications"] });
    markReadInCache(qc, "all");
    markAllReadStore();
    await Promise.allSettled(unread.map((n) => markNotificationAsRead(n.id)));
    refetch();
  }, [notifications, markAllReadStore, refetch, qc]);

  return {
    unreadCount,
    isMarkingRead: markReadMut.isPending,
    markRead,
    markAllRead,
  };
}
