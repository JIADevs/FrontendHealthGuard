import type { ShareExpiresIn, ShareResourceType } from "@helu/api";
import { formatFileSize, formatShortDate } from "@helu/ui";

export const SHARE_EXPIRATION_OPTIONS: { value: ShareExpiresIn; label: string }[] = [
  { value: "1h", label: "1 h" },
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 días" },
  { value: "never", label: "Nunca" },
];

export function shareResourceTypeLabel(type: ShareResourceType): string {
  return type === "backpack" ? "Mochila" : "Documento";
}

/** Tiempo relativo desde que se creó el enlace (p. ej. "hace 2h", "ayer", "hace 1 semana"). */
export function formatShareStartedAt(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`;
}

export function formatShareExpirationLabel(expiresIn: ShareExpiresIn): string {
  return SHARE_EXPIRATION_OPTIONS.find((o) => o.value === expiresIn)?.label ?? expiresIn;
}

export function formatShareExpiresInHuman(expiresAt: string | null): string {
  if (!expiresAt) return "Sin expiración";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `Expira en ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Expira en ${days}d`;
}

export function buildDocumentShareSubtitle(input: {
  uploadedAt?: string | null;
  fileSizeBytes?: number | null;
  format?: string;
}): string {
  const parts: string[] = [];
  if (input.uploadedAt) parts.push(formatShortDate(input.uploadedAt));
  if (input.fileSizeBytes) parts.push(formatFileSize(input.fileSizeBytes));
  else if (input.format) parts.push(input.format.toUpperCase());
  return parts.join(" · ") || "Documento médico";
}

export function buildBackpackShareSubtitle(documentCount?: number | null): string {
  const count = documentCount ?? 0;
  const docLabel = count === 1 ? "1 documento" : `${count} documentos`;
  return docLabel;
}
