"use client";

import type { FormEvent } from "react";
import { useProfileQuery } from "@helu/api/hooks";
import { useProfileForm } from "@/hooks/useProfileForm";
import { User, Save, Mail, Phone, Heart, Shield, Sun, Moon, Monitor } from "lucide-react";
import { Button, TextField, Select, Typography, DatePicker, Spinner } from "@helu/ui";
import { useUiStore } from "@helu/stores";

export default function ProfilePage() {
  const profile = useProfileQuery();
  const form = useProfileForm();

  const initials =
    profile.data?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    profile.data?.email?.[0]?.toUpperCase() ??
    "U";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    form.handleSave();
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Typography variant="h2">Mi Perfil</Typography>
          <Typography variant="bodySm" color="secondary">Administra tu información personal y de contacto.</Typography>
        </div>
      </div>

      {form.loading ? (
        <div className="empty-state">
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Avatar + email */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <Typography variant="h4">{profile.data?.name || "Sin nombre"}</Typography>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
                  <Mail size={14} />
                  {profile.data?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Información personal */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">
                <User size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
                Información Personal
              </span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <TextField id="profile-name" label="Nombre completo" value={form.name} onChange={form.setName} placeholder="Tu nombre" />
                <TextField id="profile-doc" label="Documento de identidad" value={form.documentId} onChange={form.setDocumentId} placeholder="Cédula / Pasaporte" />
                <DatePicker id="profile-birth" label="Fecha de nacimiento" value={form.birthDate} onChange={form.setBirthDate} />
                <Select
                  label="Género"
                  value={form.gender || undefined}
                  onChange={form.setGender}
                  placeholder="Sin especificar"
                  options={[
                    { value: "M", label: "Masculino" },
                    { value: "F", label: "Femenino" },
                    { value: "O", label: "Otro" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">
                <Phone size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
                Contacto
              </span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <TextField id="profile-phone" label="Teléfono" value={form.phone} onChange={form.setPhone} placeholder="+57 300 000 0000" />
                <div style={{ gridColumn: "1 / -1" }}>
                  <TextField id="profile-address" label="Dirección" value={form.address} onChange={form.setAddress} placeholder="Ciudad, departamento, dirección" />
                </div>
              </div>
            </div>
          </div>

          {/* Información médica */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">
                <Heart size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
                Información Médica
              </span>
            </div>
            <div className="card-body">
              <div style={{ maxWidth: 200 }}>
                <Select
                  label="Tipo de sangre"
                  value={form.bloodType || undefined}
                  onChange={form.setBloodType}
                  placeholder="Sin especificar"
                  options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => ({ value: bt, label: bt }))}
                />
              </div>
            </div>
          </div>

          {/* Contacto de emergencia */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">
                <Shield size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
                Contacto de Emergencia
              </span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <TextField id="profile-ec-name" label="Nombre" value={form.emergencyContactName} onChange={form.setEmergencyContactName} placeholder="Nombre del contacto" />
                <TextField id="profile-ec-phone" label="Teléfono" value={form.emergencyContactPhone} onChange={form.setEmergencyContactPhone} placeholder="+57 300 000 0000" />
              </div>
            </div>
          </div>

          {/* Apariencia */}
          <AppearanceCard />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" disabled={form.saving} loading={form.saving}>
              {form.saving ? "Guardando..." : <><Save size={16} /> Guardar Cambios</>}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

const THEME_OPTIONS = [
  { value: "light" as const, label: "Claro", icon: Sun },
  { value: "dark" as const, label: "Oscuro", icon: Moon },
  { value: "system" as const, label: "Sistema", icon: Monitor },
];

function AppearanceCard() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
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
  );
}
