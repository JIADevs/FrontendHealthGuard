"use client";

import { useDashboardCore } from "@helu/api/hooks";
import {
  FileText,
  CalendarDays,
  Pill,
  Upload,
  ArrowRight,
  Clock,
  Camera,
  Share2,
  Folder,
} from "lucide-react";
import { formatTime, Typography, Spinner } from "@helu/ui";

// ─── Quick Links (sidebar) ───────────────────────────────────────────────────

const QUICK_LINKS = [
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/backpacks", label: "Mochilas", icon: Folder },
  { href: "/share", label: "Compartir", icon: Share2 },
  { href: "/agenda", label: "Ver Agenda", icon: CalendarDays },
] as const;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const dash = useDashboardCore();

  return (
    <>
      {/* ── Branded Greeting ── */}
      <div className="dash-greeting">
        <h2>
          {dash.greeting}, {dash.userFirstName ?? ""}
        </h2>
        <div className="dash-subtitle">{dash.apptSubtitle}</div>
        <div className="dash-greeting-actions">
          <a href="/agenda" className="dash-chip">
            <CalendarDays />
            Agendar Cita
          </a>
          <a href="/documents" className="dash-chip">
            <Upload />
            Subir Documento
          </a>
          <a href="/agenda" className="dash-chip">
            <ArrowRight />
            Ver Agenda
          </a>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div className="metric-grid">
        <MetricCard
          icon={<FileText size={24} />}
          color="blue"
          label="Documentos"
          value={dash.docTotal}
        />
        <MetricCard
          icon={<CalendarDays size={24} />}
          color="green"
          label="Citas Totales"
          value={dash.apptTotal}
        />
        <MetricCard
          icon={<Pill size={24} />}
          color="amber"
          label="Medicamentos Activos"
          value={dash.medTotal}
        />
      </div>

      {/* ── Content grid: main + sidebar ── */}
      <div className="dash-content-grid">
        {/* Left column: appointments + medications */}
        <div>
          {/* Upcoming Appointments */}
          <div className="card dash-section" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">Próximas Citas</span>
              <a href="/agenda" className="btn btn-ghost" style={{ fontSize: 13 }}>
                Ver todas
              </a>
            </div>
            <div className="card-body">
              {dash.isApptsLoading ? (
                <div className="empty-state">
                  <Spinner size="lg" />
                </div>
              ) : dash.upcomingAppts.length === 0 ? (
                <div className="empty-state">
                  <CalendarDays />
                  <Typography variant="bodySm" color="secondary">
                    No hay citas pendientes.
                  </Typography>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {dash.upcomingAppts.map((a) => (
                    <div key={a.id} className="dash-item">
                      <div className="dash-item-icon calendar">
                        <CalendarDays size={18} />
                      </div>
                      <div className="dash-item-info">
                        <div className="dash-item-title">{a.specialty}</div>
                        <div className="dash-item-subtitle">
                          {a.doctor}
                          {a.location ? ` — ${a.location}` : ""}
                        </div>
                      </div>
                      <div className="dash-item-time">
                        <Clock size={14} />
                        {a.date} {a.time?.slice(0, 5)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Medications */}
          <div className="card dash-section">
            <div className="card-header">
              <span className="card-title">Medicamentos Activos</span>
              <a href="/agenda" className="btn btn-ghost" style={{ fontSize: 13 }}>
                Gestionar
              </a>
            </div>
            <div className="card-body">
              {dash.isMedsLoading ? (
                <div className="empty-state">
                  <Spinner size="lg" />
                </div>
              ) : dash.activeMeds.length === 0 ? (
                <div className="empty-state">
                  <Pill />
                  <Typography variant="bodySm" color="secondary">
                    Sin medicamentos activos.
                  </Typography>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {dash.activeMeds.map((m) => (
                    <div key={m.id} className="dash-item">
                      <div className="dash-item-icon medication">
                        <Pill size={18} />
                      </div>
                      <div className="dash-item-info">
                        <div className="dash-item-title">{m.name}</div>
                        <div className="dash-item-subtitle">
                          {m.dosage} — cada {m.frequency}h
                        </div>
                      </div>
                      {m.nextIntakeTime && (
                        <div className="dash-item-time">
                          <Clock size={14} />
                          {formatTime(m.nextIntakeTime)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: quick links */}
        <div className="dash-section">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Accesos Rápidos</span>
            </div>
            <div className="card-body">
              <div className="quick-links">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a key={link.href} href={link.href} className="quick-link-card">
                      <Icon />
                      <span className="quick-link-label">{link.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: "blue" | "green" | "amber";
  label: string;
  value: number | string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${color}`}>{icon}</div>
      <div className="metric-info">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
      </div>
    </div>
  );
}
