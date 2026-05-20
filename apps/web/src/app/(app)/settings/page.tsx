"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useUiStore } from "@helu/stores";
import { Typography } from "@helu/ui";

const THEME_OPTIONS = [
  { value: "light" as const, label: "Claro", icon: Sun },
  { value: "dark" as const, label: "Oscuro", icon: Moon },
  { value: "system" as const, label: "Sistema", icon: Monitor },
];

export default function SettingsPage() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Typography variant="h2">Configuraciones</Typography>
        <Typography variant="bodySm" color="secondary">
          Personaliza tu experiencia en Helu.
        </Typography>
      </div>

      {/* Apariencia */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">
            <Sun size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
            Apariencia
          </span>
        </div>
        <div className="card-body">
          <p style={{ marginBottom: 12, fontSize: 14, color: "var(--text-secondary)" }}>
            Elige cómo se ve Helu. &quot;Sistema&quot; sigue la configuración de tu dispositivo.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "16px 12px",
                    borderRadius: "var(--radius)",
                    border: `2px solid ${active ? "var(--brand-500)" : "var(--border)"}`,
                    background: active ? "var(--brand-50)" : "var(--bg-card)",
                    color: active ? "var(--brand-600)" : "var(--text-primary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: "inherit",
                    transition: "all var(--transition)",
                  }}
                >
                  <Icon size={22} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, marginTop: 32 }}>
        Más opciones de configuración próximamente.
      </p>
    </>
  );
}
