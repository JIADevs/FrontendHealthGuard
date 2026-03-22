"use client";

import { X } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel, loading, onConfirm, onCancel }: ConfirmModalProps) {
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
