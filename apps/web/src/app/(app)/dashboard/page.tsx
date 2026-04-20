"use client";

import { useDashboardCore } from "@helu/api/hooks";
import {
  FileText,
  CalendarDays,
  Pill,
  Upload,
  ArrowRight,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";
import {
  formatDateLocal,
  splitDate,
  formatFileKind,
  Typography,
  Spinner,
} from "@helu/ui";

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
          <span className="brand-name">Helu</span>, {dash.userFirstName ?? ""}
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

      {/* ── Tu día — summary card ── */}
      <div className="day-card">
        <a href="/agenda" className="day-item">
          <div className="day-icon calendar">
            <CalendarDays size={18} />
          </div>
          <div className="day-value">{dash.todayApptCount}</div>
          <div className="day-label">
            {dash.todayApptCount === 1 ? "Cita hoy" : "Citas hoy"}
          </div>
        </a>
        <div className="day-separator" />
        <a href="/agenda?tab=medications" className="day-item">
          <div className="day-icon medication">
            <Pill size={18} />
          </div>
          <div className="day-value">{dash.activeMeds.length}</div>
          <div className="day-label">Medicamentos</div>
        </a>
        <div className="day-separator" />
        <a href="/documents" className="day-item">
          <div className="day-icon document">
            <FileText size={18} />
          </div>
          <div className="day-value">{dash.docTotal}</div>
          <div className="day-label">Documentos</div>
        </a>
      </div>

      {/* ── Content ── */}
      <div>
          {/* ── Featured Next Appointment ── */}
          <div className="card dash-section" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">Próxima Cita</span>
              <a href="/agenda" className="see-all-link">
                Ver todas <ChevronRight size={14} />
              </a>
            </div>
            <div className="card-body">
              {dash.isApptsLoading ? (
                <div className="empty-state">
                  <Spinner size="lg" />
                </div>
              ) : !dash.nextAppt ? (
                <div className="empty-state">
                  <CalendarDays />
                  <Typography variant="bodySm" color="secondary">
                    No hay citas pendientes.
                  </Typography>
                </div>
              ) : (
                <a href="/agenda" className="featured-appt">
                  <div className="featured-accent" />
                  <div className="featured-icon calendar">
                    <CalendarDays size={18} />
                  </div>
                  <div className="featured-info">
                    <div className="featured-title">{dash.nextAppt.specialty}</div>
                    <div className="featured-sub">{dash.nextAppt.doctor}</div>
                    {dash.nextAppt.location && (
                      <div className="featured-location">
                        <MapPin size={11} />
                        {dash.nextAppt.location}
                      </div>
                    )}
                  </div>
                  <div className="date-badge">
                    <div className="date-badge-day">
                      {splitDate(dash.nextAppt.date).day}
                    </div>
                    <div className="date-badge-month">
                      {splitDate(dash.nextAppt.date).month}
                    </div>
                    {dash.nextAppt.time && (
                      <div className="date-badge-time">
                        {dash.nextAppt.time.slice(0, 5)}
                      </div>
                    )}
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* ── Medications Grid ── */}
          <div className="dash-section" style={{ marginBottom: 24 }}>
            <div className="section-header-flat">
              <span className="card-title">Medicamentos</span>
              <a href="/agenda?tab=medications" className="see-all-link">
                Gestionar <ChevronRight size={14} />
              </a>
            </div>
            {dash.isMedsLoading ? (
              <div className="empty-state">
                <Spinner size="lg" />
              </div>
            ) : dash.activeMeds.length === 0 ? (
              <div className="card" style={{ padding: 24 }}>
                <div className="empty-state">
                  <Pill />
                  <Typography variant="bodySm" color="secondary">
                    Sin medicamentos activos.
                  </Typography>
                </div>
              </div>
            ) : (
              <div className="med-grid">
                {dash.activeMeds.map((m) => (
                  <div key={m.id} className="med-card">
                    <div className="med-icon">
                      <Pill size={16} />
                    </div>
                    <div className="med-name">{m.name}</div>
                    <div className="med-dosage">{m.dosage}</div>
                    {m.nextIntakeTime ? (
                      <div className="med-time-badge">
                        <Clock size={10} />
                        {m.nextIntakeTime.slice(0, 5)}
                      </div>
                    ) : (
                      <div className="med-freq">Cada {m.frequency}h</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Recent Documents Grid ── */}
          <div className="dash-section">
            <div className="section-header-flat">
              <span className="card-title">Documentos Recientes</span>
              <a href="/documents" className="see-all-link">
                Ver todos <ChevronRight size={14} />
              </a>
            </div>
            {dash.isDocsLoading ? (
              <div className="empty-state">
                <Spinner size="lg" />
              </div>
            ) : dash.recentDocs.length === 0 ? (
              <div className="card" style={{ padding: 24 }}>
                <div className="empty-state">
                  <FileText />
                  <Typography variant="bodySm" color="secondary">
                    Aún no has subido documentos.
                  </Typography>
                </div>
              </div>
            ) : (
              <div className="doc-grid">
                {dash.recentDocs.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="doc-card"
                  >
                    <div className="doc-icon">
                      <FileText size={18} />
                    </div>
                    <div className="doc-title">{doc.title}</div>
                    <div className="doc-footer">
                      <span className="doc-kind-badge">
                        {formatFileKind(doc.format)}
                      </span>
                      <span className="doc-date">
                        {formatDateLocal(doc.uploadedAt)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
      </div>
    </>
  );
}
