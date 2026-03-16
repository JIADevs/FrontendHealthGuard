"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, useNotifStore, useUnreadCount } from "@healthguard/stores";
import { getNotifications, markNotificationAsRead } from "@healthguard/api";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Backpack,
  Share2,
  LogOut,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/backpacks", label: "Mochilas", icon: Backpack },
  { href: "/share", label: "Compartir", icon: Share2 },
] as const;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isHydrated, user, logout } = useAuthStore();

  // Auth guard
  useEffect(() => {
    console.log("[AppLayout] state:", { isHydrated, token: !!token, pathname });
    if (isHydrated && !token) {
      console.log("[AppLayout] No token found, redirecting to login...");
      router.replace("/login");
    }
  }, [isHydrated, token, router, pathname]);

  if (!isHydrated) return null; // Render nothing until hydrated

  if (!token) return null;

  const initials =
    user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ?? "U";

  const pageTitle = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? "HealthGuard";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">H</div>
          <span className="sidebar-brand">HealthGuard</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`}>
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link" onClick={handleLogout} type="button">
            <LogOut />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{pageTitle}</h2>
          <div className="topbar-actions">
            <NotificationBell />
            <div className="avatar">{initials}</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = useUnreadCount();
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);
  const decrementUnread = useNotifStore((s) => s.decrementUnread);

  const notifs = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications({ page: 1, limit: 20 }),
    refetchInterval: 30_000,
  });

  // Sync unread count
  useEffect(() => {
    if (notifs.data) {
      const count = notifs.data.items.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    }
  }, [notifs.data, setUnreadCount]);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const readMut = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      decrementUnread();
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="icon-btn" title="Notificaciones" type="button" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {unread > 0 && <span className="badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Notificaciones</h4>
            {unread > 0 && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{unread} sin leer</span>}
          </div>
          <div className="notif-list">
            {(notifs.data?.items.length ?? 0) === 0 ? (
              <div className="notif-empty">No tienes notificaciones</div>
            ) : (
              notifs.data!.items.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item${!n.isRead ? " unread" : ""}`}
                  onClick={() => { if (!n.isRead) readMut.mutate(n.id); }}
                >
                  <div className={`notif-dot${n.isRead ? " read" : ""}`} />
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-text">{n.body}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
