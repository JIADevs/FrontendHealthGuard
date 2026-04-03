"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { formatDate, Button, Typography } from "@healthguard/ui";

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
      {label && <Typography variant="bodyLg">{label}</Typography>}
      <Typography variant="bodySm" color="secondary">Expira el {formatDate(expiresAt)}</Typography>
      <div className="share-url">
        <input readOnly value={shareUrl} />
        <Button variant="ghost" size="sm" onPress={handleCopy}>
          {copied ? "✓ Copiado" : <><Copy size={14} /> Copiar</>}
        </Button>
      </div>
    </div>
  );
}
