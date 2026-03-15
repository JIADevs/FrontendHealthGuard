"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@healthguard/stores";
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isHydrated, user, logout } = useAuthStore();

  // Auth guard
  useEffect(() => {
    if (isHydrated && !token) {
      router.replace("/login");
    }
  }, [isHydrated, token, router]);

  if (!isHydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" style={{ borderColor: "var(--gray-200)", borderTopColor: "var(--primary-500)", width: 32, height: 32 }} />
      </div>
    );
  }

  if (!token) return null;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  const pageTitle =
    NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? "HealthGuard";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
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
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${active ? " active" : ""}`}
              >
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

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{pageTitle}</h2>
          <div className="topbar-actions">
            <button className="icon-btn" title="Notificaciones" type="button">
              <Bell size={20} />
            </button>
            <div className="avatar">{initials}</div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
