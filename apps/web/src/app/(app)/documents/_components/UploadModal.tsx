"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDocumentTypesQuery } from "@healthguard/api/hooks";
import { Upload, FileText, X, FileUp } from "lucide-react";
import {
  uploadFile,
  createDocument,
  isApiError,
  type DocumentTypeOut,
  type DocumentCreate,
} from "@healthguard/api";
import { sileo } from "sileo";

const TEMPLATE_ICONS: Record<string, string> = {
  "Historia Clínica": "📋",
  "Examen de Laboratorio": "🔬",
  "Imagen Diagnóstica": "🩻",
  "Fórmula Médica": "💊",
};

export function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"template" | "file" | "tags">("template");
  const [selectedType, setSelectedType] = useState<DocumentTypeOut | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]!);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const types = useDocumentTypesQuery();

  function handleFilePick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    setStep("tags");
  }

  async function handleSubmit() {
    if (!file || !title) return;
    setUploading(true);
    setError(null);
    try {
      const { storagePath } = await uploadFile(file);
      const docPayload: DocumentCreate = {
        title,
        fileUrl: storagePath,
        format: file.type || "application/octet-stream",
        file_size_bytes: file.size,
        documentDate: docDate,
        typeId: selectedType?.id,
        subtypeIds: [],
        specialtyIds: [],
        tagValueIds: [],
      };
      await createDocument(docPayload);
      qc.invalidateQueries({ queryKey: ["documents"] });
      sileo.success({ title: "Documento creado" });
      onClose();
    } catch (err) {
      const message = isApiError(err) ? err.message : "Error subiendo documento";
      setError(message);
      sileo.error({ title: "Error al subir", description: message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {step === "template" ? "Tipo de Documento" : step === "file" ? "Cargar Archivo" : "Detalles"}
          </h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {step === "template" && (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
                Selecciona el tipo para sugerir etiquetas automáticamente.
              </p>
              <div className="template-grid">
                {(types.data as DocumentTypeOut[] ?? []).slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className={`template-card${selectedType?.id === t.id ? " selected" : ""}`}
                    onClick={() => { setSelectedType(t); setStep("file"); }}
                  >
                    <div className="template-card-icon">{TEMPLATE_ICONS[t.name] ?? "📄"}</div>
                    <div className="template-card-name">{t.name}</div>
                  </div>
                ))}
                <div className="template-card" onClick={() => { setSelectedType(null); setStep("file"); }}>
                  <div className="template-card-icon">📎</div>
                  <div className="template-card-name">Otro</div>
                </div>
              </div>
            </>
          )}

          {step === "file" && (
            <>
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("active"); }}
                onDragLeave={(e) => e.currentTarget.classList.remove("active")}
                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("active"); handleFilePick(e.dataTransfer.files); }}
              >
                <FileUp size={40} />
                <p>Arrastra tu archivo aquí o <span className="highlight">haz clic para seleccionar</span></p>
                <p style={{ fontSize: 12, marginTop: 8 }}>PDF, imágenes o DICOM</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm,image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFilePick(e.target.files)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={() => setStep("template")}>← Atrás</button>
              </div>
            </>
          )}

          {step === "tags" && (
            <>
              {file && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--success-50)", borderRadius: "var(--radius-sm)", marginBottom: 20 }}>
                  <FileText size={20} style={{ color: "var(--success-600)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{(file.size / 1024).toFixed(0)} KB — Listo para guardar</div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Nombre del documento</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Fecha del documento</label>
                <input className="form-input" type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
              </div>

              {selectedType && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)", marginBottom: 6, display: "block" }}>Tipo seleccionado</label>
                  <span className="tag-chip">{selectedType.name}</span>
                </div>
              )}

              {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={() => setStep("file")}>← Atrás</button>
                <button
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                  disabled={!title || uploading}
                  onClick={handleSubmit}
                  id="save-doc-btn"
                >
                  {uploading ? <span className="spinner" /> : <Upload size={16} />}
                  {uploading ? "Subiendo..." : "Guardar Documento"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
