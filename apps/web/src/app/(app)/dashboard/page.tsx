"use client";

import { useEffect } from "react";
import {
  useProfileQuery,
  useDocumentsQuery,
  useAppointmentsQuery,
  useMedicationsQuery,
} from "@healthguard/api/hooks";
import {
  FileText,
  CalendarDays,
  Pill,
  Upload,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatTime, todayISODate } from "@healthguard/ui";
import { useAuthStore } from "@healthguard/stores";

export default function DashboardPage() {
  const setUser = useAuthStore((s) => s.setUser);

  const profile = useProfileQuery();
  const docs  = useDocumentsQuery("", 1, 1);
  const appts = useAppointmentsQuery("", 1, 3, todayISODate());
  const meds  = useMedicationsQuery(1, 3);

  useEffect(() => {
    if (profile.data) {
      setUser({
        id: profile.data.id,
        name: profile.data.name,
        email: profile.data.email,
      });
    }
  }, [profile.data, setUser]);

  const todayApptCount =
    appts.data?.items.filter((a) => a.status === "PENDING").length ?? 0;

  return (
    <>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          ¡Hola de nuevo! 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {todayApptCount > 0
            ? `Tienes ${todayApptCount} cita${todayApptCount > 1 ? "s" : ""} pendiente${todayApptCount > 1 ? "s" : ""} hoy.`
            : "No tienes citas pendientes hoy."}
        </p>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard
          icon={<FileText size={24} />}
          color="blue"
          label="Documentos"
          value={docs.data?.total ?? "—"}
        />
        <MetricCard
          icon={<CalendarDays size={24} />}
          color="green"
          label="Citas Totales"
          value={appts.data?.total ?? "—"}
        />
        <MetricCard
          icon={<Pill size={24} />}
          color="amber"
          label="Medicamentos Activos"
          value={meds.data?.total ?? "—"}
        />
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <a href="/documents" className="btn btn-primary" style={{ width: "auto" }}>
          <Upload size={16} />
          Subir Documento
        </a>
        <a href="/agenda" className="btn btn-ghost">
          Ver Agenda
          <ArrowRight size={16} />
        </a>
      </div>

      {/* Upcoming appointments */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Citas Pendientes</span>
          <a href="/agenda" className="btn btn-ghost" style={{ fontSize: 13 }}>
            Ver todas
          </a>
        </div>
        <div className="card-body">
          {appts.isLoading ? (
            <div className="empty-state">
              <div className="spinner spinner--page" style={{ margin: "0 auto" }} />
            </div>
          ) : (appts.data?.items.length ?? 0) === 0 ? (
            <div className="empty-state">
              <CalendarDays />
              <p>No hay citas pendientes.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {appts.data?.items.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 16px",
                    background: "var(--gray-50)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div className="metric-icon blue" style={{ width: 40, height: 40 }}>
                    <CalendarDays size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.specialty}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                      {a.doctor} — {a.location}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: 13 }}>
                    <Clock size={14} />
                    {a.date} {a.time?.slice(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active medications */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Tratamientos Activos</span>
          <a href="/agenda" className="btn btn-ghost" style={{ fontSize: 13 }}>
            Gestionar
          </a>
        </div>
        <div className="card-body">
          {meds.isLoading ? (
            <div className="empty-state">
              <div className="spinner spinner--page" style={{ margin: "0 auto" }} />
            </div>
          ) : (meds.data?.items.length ?? 0) === 0 ? (
            <div className="empty-state">
              <Pill />
              <p>Sin medicamentos activos.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {meds.data?.items.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 16px",
                    background: "var(--gray-50)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div className="metric-icon amber" style={{ width: 40, height: 40 }}>
                    <Pill size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                      {m.dosage} — cada {m.frequency}h
                    </div>
                  </div>
                  {m.nextIntakeTime && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: 13 }}>
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
    </>
  );
}

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
