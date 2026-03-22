"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { formatDate } from "@healthguard/ui";

interface ShareResultProps {
  shareUrl: string;
  qrCodeUrl: string;
  expiresAt: string;
  label?: string;
}

/**
 * Reusable QR + copy-link block shown after generating a share link.
 * Used by both documents and backpacks share flows.
 */
export function ShareResult({ shareUrl, qrCodeUrl, expiresAt, label }: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="share-result">
      <img src={qrCodeUrl} alt="QR Code" width={150} height={150} style={{ display: "block" }} />
      {label && <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{label}</p>}
      <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        Expira el {formatDate(expiresAt)}
      </p>
      <div className="share-url">
        <input readOnly value={shareUrl} />
        <button className="btn btn-ghost" onClick={handleCopy} style={{ padding: "6px 12px" }}>
          {copied ? "✓ Copiado" : <><Copy size={14} /> Copiar</>}
        </button>
      </div>
    </div>
  );
}
