"use client";

import type { FormEvent } from "react";
import { useProfileQuery } from "@healthguard/api/hooks";
import { useProfileForm } from "@/hooks/useProfileForm";
import { User, Save, Mail, Phone, Heart, Shield } from "lucide-react";
import { Button, TextField, Typography } from "@healthguard/ui";

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
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
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
                <TextField id="profile-birth" label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={form.setBirthDate} />
                <div className="form-group">
                  <label htmlFor="profile-gender">Género</label>
                  <select id="profile-gender" className="form-input" value={form.gender} onChange={(e) => form.setGender(e.target.value)}>
                    <option value="">Sin especificar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
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
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label htmlFor="profile-blood">Tipo de sangre</label>
                <select id="profile-blood" className="form-input" value={form.bloodType} onChange={(e) => form.setBloodType(e.target.value)}>
                  <option value="">Sin especificar</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
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
