"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Upload,
  FileText,
  Image,
  Trash2,
  Share2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileUp,
  Sparkles,
} from "lucide-react";
import {
  getDocuments,
  getDocumentTypes,
  getTagCategories,
  uploadFile,
  createDocument,
  deleteDocument,
  shareDocument,
  classifyDocument,
  getSignedUrl,
  getDocumentById,
  isApiError,
  type Document,
  type DocumentTypeOut,
  type DocumentCreate,
} from "@healthguard/api";

import "./documents.css";

// ── Helpers ──────────────────────────────────────────
function formatIcon(format: string) {
  const f = format?.toLowerCase() ?? "";
  if (f.includes("pdf")) return { cls: "pdf", label: "PDF" };
  if (f.includes("dicom") || f.includes("dcm")) return { cls: "dcm", label: "DCM" };
  if (f.includes("image") || f.includes("jpg") || f.includes("png") || f.includes("jpeg"))
    return { cls: "img", label: "IMG" };
  return { cls: "other", label: "DOC" };
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// ══════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════
export default function DocumentsPage() {
  const qc = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [shareTarget, setShareTarget] = useState<Document | null>(null);

  // Queries
  const docs = useQuery({
    queryKey: ["documents", page, search],
    queryFn: () => getDocuments({ page, limit: 12, searchQuery: search || undefined }),
  });

  const total = docs.data?.total ?? 0;
  const totalPages = docs.data?.totalPages ?? 1;

  console.log(docs.data)
  // Delete mutation
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      setDeleteTarget(null);
    },
  });

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Documentos Médicos</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {total} documento{total !== 1 ? "s" : ""} en tu carpeta
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowUpload(true)} id="upload-doc-btn">
          <Upload size={16} />
          Subir Documento
        </button>
      </div>

      {/* Search */}
      <div className="docs-toolbar">
        <div className="search-wrapper">
          <Search size={18} />
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por nombre o etiqueta..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            id="doc-search"
          />
        </div>
      </div>

      {/* Grid */}
      {docs.isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ borderColor: "var(--gray-200)", borderTopColor: "var(--primary-500)", margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (docs.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <FileText />
          <p>{search ? "Sin resultados para esta búsqueda." : "No tienes documentos aún. ¡Sube tu primer documento!"}</p>
        </div>
      ) : (
        <div className="doc-grid">
          {docs.data!.items.map((doc) => {
            const icon = formatIcon(doc.format);
            return (
              <div key={doc.id} className="doc-card" onClick={() => setDetailId(doc.id)}>
                <div className="doc-card-header">
                  <div className={`doc-card-icon ${icon.cls}`}>{icon.label}</div>
                  <div>
                    <div className="doc-card-title">{doc.title}</div>
                    <div className="doc-card-date">{formatDate(doc.documentDate ?? doc.uploadedAt)}</div>
                  </div>
                </div>
                {(doc.subtypes.length > 0 || doc.customTags.length > 0) && (
                  <div className="doc-card-tags">
                    {doc.subtypes.map((s) => <span key={s.id} className="tag-chip">{s.name}</span>)}
                    {doc.customTags.slice(0, 3).map((t) => <span key={t.id} className="tag-chip green">{t.value}</span>)}
                  </div>
                )}
                <div className="doc-card-actions">
                  <button className="icon-btn" title="Ver" onClick={(e) => { e.stopPropagation(); setDetailId(doc.id); }}><Eye size={16} /></button>
                  <button className="icon-btn" title="Compartir" onClick={(e) => { e.stopPropagation(); setShareTarget(doc); }}><Share2 size={16} /></button>
                  <button className="icon-btn" title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc); }}><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + Math.max(1, page - 2);
            if (p > totalPages) return null;
            return <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          <span className="pagination-info">{total} resultados</span>
        </div>
      )}

      {/* Modals */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {detailId && <DetailModal id={detailId} onClose={() => setDetailId(null)} />}
      {shareTarget && <ShareModal doc={shareTarget} onClose={() => setShareTarget(null)} />}
      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Documento"
          message={`¿Estás seguro de eliminar "${deleteTarget.title}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════
//  UPLOAD MODAL
// ══════════════════════════════════════════════════════
function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"template" | "file" | "tags">("template");
  const [selectedType, setSelectedType] = useState<DocumentTypeOut | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]!);
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const types = useQuery({ queryKey: ["doc-types"], queryFn: getDocumentTypes });

  // Templates — top 5 types + "Otro"
  const TEMPLATE_ICONS: Record<string, string> = {
    "Historia Clínica": "📋",
    "Examen de Laboratorio": "🔬",
    "Imagen Diagnóstica": "🩻",
    "Fórmula Médica": "💊",
  };

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
      const { fileUrl } = await uploadFile(file);
      const docPayload: DocumentCreate = {
        title,
        fileUrl,
        format: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        documentDate: docDate,
        typeId: selectedType?.id,
        subtypeIds: [],
        specialtyIds: [],
        tagValueIds: tags,
      };
      await createDocument(docPayload);
      qc.invalidateQueries({ queryKey: ["documents"] });
      onClose();
    } catch (err) {
      setError(isApiError(err) ? err.message : "Error subiendo documento");
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

// ══════════════════════════════════════════════════════
//  DETAIL MODAL
// ══════════════════════════════════════════════════════
function DetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const doc = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id),
  });

  const signedUrl = useQuery({
    queryKey: ["signed-url", doc.data?.fileUrl],
    queryFn: () => getSignedUrl(doc.data!.fileUrl),
    enabled: !!doc.data?.fileUrl,
  });

  const d = doc.data as Document | undefined;
  const url = signedUrl.data?.url;
  const isPdf = d?.format?.toLowerCase().includes("pdf");
  const isImage = d?.format?.toLowerCase().match(/image|jpg|jpeg|png/);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{d?.title ?? "Cargando..."}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {doc.isLoading ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: "var(--gray-200)", borderTopColor: "var(--primary-500)", margin: "0 auto", width: 32, height: 32 }} />
            </div>
          ) : d ? (
            <>
              {/* Meta */}
              <dl className="doc-detail-meta">
                <div><dt>Fecha</dt><dd>{formatDate(d.documentDate)}</dd></div>
                <div><dt>Formato</dt><dd>{d.format}</dd></div>
                <div><dt>Subido</dt><dd>{formatDate(d.uploadedAt)}</dd></div>
                <div><dt>Tamaño</dt><dd>{d.fileSizeBytes ? `${(d.fileSizeBytes / 1024).toFixed(0)} KB` : "—"}</dd></div>
              </dl>

              {/* Tags */}
              {(d.subtypes.length > 0 || d.customTags.length > 0 || d.specialties.length > 0) && (
                <div className="doc-card-tags" style={{ marginBottom: 20 }}>
                  {d.subtypes.map((s) => <span key={s.id} className="tag-chip">{s.name}</span>)}
                  {d.specialties.map((s) => <span key={s.id} className="tag-chip amber">{s.name}</span>)}
                  {d.customTags.map((t) => <span key={t.id} className="tag-chip green">{t.value}</span>)}
                </div>
              )}

              {/* Preview */}
              {url && (
                <div className="doc-preview">
                  {isPdf ? (
                    <iframe src={url} title={d.title} />
                  ) : isImage ? (
                    <img src={url} alt={d.title} />
                  ) : (
                    <div className="empty-state"><p>Vista previa no disponible para este formato.</p></div>
                  )}
                </div>
              )}

              {url && (
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <a href={url} target="_blank" rel="noopener" className="btn btn-ghost" style={{ fontSize: 13 }}>
                    <ExternalLink size={14} /> Ver Completo
                  </a>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  SHARE MODAL
// ══════════════════════════════════════════════════════
function ShareModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareMut = useMutation({ mutationFn: () => shareDocument(doc.id) });

  // Auto-trigger share on mount
  if (!shareMut.data && !shareMut.isPending && !shareMut.isError) {
    shareMut.mutate();
  }

  function handleCopy() {
    if (shareMut.data?.shareUrl) {
      navigator.clipboard.writeText(shareMut.data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Compartir Documento</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {shareMut.isPending ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: "var(--gray-200)", borderTopColor: "var(--primary-500)", margin: "0 auto", width: 32, height: 32 }} />
              <p style={{ marginTop: 12 }}>Generando enlace...</p>
            </div>
          ) : shareMut.data ? (
            <div className="share-result">
              <img
                src={shareMut.data.qrCodeUrl}
                alt="QR Code"
                width={150}
                height={150}
                style={{ display: "block" }}
              />
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{doc.title}</p>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Expira el {formatDate(shareMut.data.expiresAt)}
              </p>
              <div className="share-url">
                <input readOnly value={shareMut.data.shareUrl} />
                <button className="btn btn-ghost" onClick={handleCopy} style={{ padding: "6px 12px" }}>
                  {copied ? "✓ Copiado" : <><Copy size={14} /> Copiar</>}
                </button>
              </div>
            </div>
          ) : shareMut.isError ? (
            <div className="empty-state"><p>Error generando el enlace.</p></div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  CONFIRM MODAL (reusable)
// ══════════════════════════════════════════════════════
function ConfirmModal({
  title,
  message,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ paddingTop: 32 }}>
          <p className="confirm-title">{title}</p>
          <p className="confirm-message">{message}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancelar</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
              {loading && <span className="spinner" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
