"use client";

import type { FormEvent } from "react";
import { useProfileQuery } from "@healthguard/api/hooks";
import { useProfileForm } from "@/hooks/useProfileForm";
import { User, Save, Mail, Phone, MapPin, Heart, Shield, Loader2 } from "lucide-react";
import { Button } from "@healthguard/ui";

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
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Mi Perfil</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Administra tu información personal y de contacto.
          </p>
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
                <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.data?.name || "Sin nombre"}</div>
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
                <div className="form-group">
                  <label htmlFor="profile-name">Nombre completo</label>
                  <input id="profile-name" className="form-input" value={form.name} onChange={(e) => form.setName(e.target.value)} placeholder="Tu nombre" />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-doc">Documento de identidad</label>
                  <input id="profile-doc" className="form-input" value={form.documentId} onChange={(e) => form.setDocumentId(e.target.value)} placeholder="Cédula / Pasaporte" />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-birth">Fecha de nacimiento</label>
                  <input id="profile-birth" className="form-input" type="date" value={form.birthDate} onChange={(e) => form.setBirthDate(e.target.value)} />
                </div>
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
                <div className="form-group">
                  <label htmlFor="profile-phone">Teléfono</label>
                  <input id="profile-phone" className="form-input" value={form.phone} onChange={(e) => form.setPhone(e.target.value)} placeholder="+57 300 000 0000" />
                </div>
                <div className="form-group full">
                  <label htmlFor="profile-address">
                    <MapPin size={13} style={{ verticalAlign: -1, marginRight: 4 }} />
                    Dirección
                  </label>
                  <input id="profile-address" className="form-input" value={form.address} onChange={(e) => form.setAddress(e.target.value)} placeholder="Ciudad, departamento, dirección" />
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
                <div className="form-group">
                  <label htmlFor="profile-ec-name">Nombre</label>
                  <input id="profile-ec-name" className="form-input" value={form.emergencyContactName} onChange={(e) => form.setEmergencyContactName(e.target.value)} placeholder="Nombre del contacto" />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-ec-phone">Teléfono</label>
                  <input id="profile-ec-phone" className="form-input" value={form.emergencyContactPhone} onChange={(e) => form.setEmergencyContactPhone(e.target.value)} placeholder="+57 300 000 0000" />
                </div>
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
