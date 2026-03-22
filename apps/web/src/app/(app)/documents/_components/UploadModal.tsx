"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, FileUp, Sparkles, Loader2, Plus, Check } from "lucide-react";
import { useDocumentForm } from "@/hooks/useDocumentForm";

const TEMPLATE_ICONS: Record<string, string> = {
  "Historia Clínica": "📋",
  "Examen de Laboratorio": "🔬",
  "Imagen Diagnóstica": "🩻",
  "Fórmula Médica": "💊",
};

const FILE_INFO_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 12,
  background: "var(--success-50)",
  borderRadius: "var(--radius-sm)",
  marginBottom: 20,
};

export function UploadModal({
  onClose,
  backpackId,
  backpackName,
}: {
  onClose: () => void;
  backpackId?: string;
  backpackName?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"template" | "file" | "details">("template");
  const [file, setFile] = useState<File | null>(null);
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]!);
  const [openTagCat, setOpenTagCat] = useState<string | null>(null);

  const form = useDocumentForm({ backpackId, backpackName, onSuccess: onClose });

  function handleFilePick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    if (!form.title) form.setTitle(f.name.replace(/\.[^/.]+$/, ""));
    setStep("details");
  }

  const selectedTypeObj = form.catalogs.types.find((t) => t.id === form.selectedType);
  const availableSpecialties = selectedTypeObj?.specialties ?? [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {step === "template"
              ? "Tipo de Documento"
              : step === "file"
                ? "Cargar Archivo"
                : "Detalles del Documento"}
          </h3>
          <button className="modal-close" onClick={onClose} type="button"><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* ── Step 1: Template ── */}
          {step === "template" && (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
                Selecciona el tipo para sugerir etiquetas automáticamente.
              </p>
              <div className="template-grid">
                {form.catalogs.types.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className={`template-card${form.selectedType === t.id ? " selected" : ""}`}
                    onClick={() => { form.setSelectedType(t.id); setStep("file"); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") { form.setSelectedType(t.id); setStep("file"); } }}
                  >
                    <div className="template-card-icon">{TEMPLATE_ICONS[t.name] ?? "📄"}</div>
                    <div className="template-card-name">{t.name}</div>
                  </div>
                ))}
                <div
                  className="template-card"
                  onClick={() => { form.setSelectedType(undefined); setStep("file"); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") { form.setSelectedType(undefined); setStep("file"); } }}
                >
                  <div className="template-card-icon">📎</div>
                  <div className="template-card-name">Otro</div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: File pick + optional AI classify ── */}
          {step === "file" && (
            <>
              {!file ? (
                <div
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("active"); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("active")}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("active"); handleFilePick(e.dataTransfer.files); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
                >
                  <FileUp size={40} />
                  <p>Arrastra tu archivo aquí o <span className="highlight">haz clic para seleccionar</span></p>
                  <p style={{ fontSize: 12, marginTop: 8 }}>PDF, imágenes o DICOM — máx. 25 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.dcm,image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFilePick(e.target.files)}
                  />
                </div>
              ) : (
                <>
                  <div style={FILE_INFO_STYLE}>
                    <FileText size={20} style={{ color: "var(--success-600)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button type="button" className="icon-btn" onClick={() => setFile(null)}><X size={14} /></button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ width: "auto", gap: 8 }}
                      onClick={() => form.handleAIClassify(file)}
                      disabled={form.classifying}
                    >
                      {form.classifying
                        ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                        : <Sparkles size={15} />}
                      {form.classifying ? "Clasificando..." : "Clasificar con IA"}
                    </button>
                    {form.classificationResult && (
                      <span style={{ fontSize: 12, color: "var(--success-600)" }}>
                        <Check size={12} style={{ verticalAlign: -1, marginRight: 3 }} />
                        Clasificado automáticamente
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "auto", marginLeft: "auto" }}
                      onClick={() => setStep("details")}
                    >
                      Continuar →
                    </button>
                  </div>
                </>
              )}

              <div style={{ marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep("template")}>← Atrás</button>
              </div>
            </>
          )}

          {/* ── Step 3: Details ── */}
          {step === "details" && file && (
            <>
              {/* File info bar */}
              <div style={FILE_INFO_STYLE}>
                <FileText size={20} style={{ color: "var(--success-600)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {form.classificationResult && " · Clasificado con IA"}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
                  onClick={() => form.handleAIClassify(file)}
                  disabled={form.classifying}
                >
                  {form.classifying
                    ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    : <Sparkles size={13} />}
                  {form.classifying ? "..." : "Re-clasificar"}
                </button>
              </div>

              {/* Title + date */}
              <div className="form-grid">
                <div className="form-group full">
                  <label htmlFor="doc-title">Nombre del documento *</label>
                  <input
                    id="doc-title"
                    className="form-input"
                    value={form.title}
                    onChange={(e) => form.setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group full">
                  <label htmlFor="doc-date">Fecha del documento</label>
                  <input
                    id="doc-date"
                    className="form-input"
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Type chips */}
              {form.catalogs.types.length > 0 && (
                <div className="form-group">
                  <label>Tipo de documento</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {form.catalogs.types.slice(0, 6).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`tag-chip${form.selectedType === t.id ? " selected" : ""}`}
                        onClick={() => form.setSelectedType(form.selectedType === t.id ? undefined : t.id)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialty chips */}
              {availableSpecialties.length > 0 && (
                <div className="form-group">
                  <label>Especialidad</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {availableSpecialties.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`tag-chip${form.selectedSpecialty === s.id ? " selected" : ""}`}
                        onClick={() => form.setSelectedSpecialty(form.selectedSpecialty === s.id ? undefined : s.id)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag categories */}
              {form.catalogs.tags.length > 0 && (
                <div className="form-group">
                  <label>Etiquetas</label>
                  {form.catalogs.tags.map((cat) => (
                    <div key={cat.id} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 6 }}>
                        {cat.name}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {cat.values.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className={`tag-chip${form.selectedTags.includes(v.id) ? " selected" : ""}`}
                            onClick={() => form.toggleTag(v.id)}
                          >
                            {form.selectedTags.includes(v.id) && <Check size={11} style={{ marginRight: 3 }} />}
                            {v.value}
                          </button>
                        ))}

                        {openTagCat === cat.id ? (
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input
                              className="form-input"
                              style={{ width: 130, padding: "3px 8px", fontSize: 12, height: 28 }}
                              placeholder="Nueva etiqueta"
                              value={form.newTagValues[cat.id] ?? ""}
                              onChange={(e) => form.setNewTagValue(cat.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); form.handleAddCustomTag(cat.id); }
                                if (e.key === "Escape") setOpenTagCat(null);
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ width: "auto", padding: "3px 10px", fontSize: 12, height: 28 }}
                              disabled={!form.newTagValues[cat.id]?.trim() || form.addingTag === cat.id}
                              onClick={() => form.handleAddCustomTag(cat.id).then(() => setOpenTagCat(null))}
                            >
                              {form.addingTag === cat.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "+"}
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setOpenTagCat(null)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="tag-chip"
                            style={{ opacity: 0.6 }}
                            onClick={() => setOpenTagCat(cat.id)}
                          >
                            <Plus size={10} style={{ marginRight: 2 }} /> Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New category + tag */}
              <div className="form-group">
                <label style={{ fontSize: 12, opacity: 0.75 }}>Crear nueva categoría de etiqueta</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Categoría (ej: Médico)"
                    value={form.newCategoryName}
                    onChange={(e) => form.setNewCategoryName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="form-input"
                    placeholder="Valor (ej: Dr. López)"
                    value={form.newTagValue}
                    onChange={(e) => form.setNewTagValueField(e.target.value)}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); form.handleAddCategoryAndTag(); } }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: "auto" }}
                    onClick={() => form.handleAddCategoryAndTag()}
                    disabled={!form.newCategoryName.trim() || !form.newTagValue.trim() || form.addingCustomTag}
                  >
                    {form.addingCustomTag ? <span className="spinner" /> : <Plus size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep("file")}>← Atrás</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                  disabled={!form.title || form.uploading}
                  onClick={() => form.handleUpload(file, docDate)}
                >
                  {form.uploading ? <span className="spinner" /> : <Upload size={16} />}
                  {form.uploading ? "Subiendo..." : "Guardar Documento"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
