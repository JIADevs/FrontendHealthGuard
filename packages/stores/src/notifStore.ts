import { create } from "zustand";

type NotifState = {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    decrementUnread: () => void;
    markAllRead: () => void;
};

export const useNotifStore = create<NotifState>()((set) => ({
    unreadCount: 0,
    setUnreadCount: (count) => set({ unreadCount: count }),
    decrementUnread: () =>
        set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
    markAllRead: () => set({ unreadCount: 0 }),
}));

export const useUnreadCount = () => useNotifStore((s) => s.unreadCount);
